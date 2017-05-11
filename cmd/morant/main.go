package main

import (
	"database/sql"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/facebookgo/grace/gracehttp"
	"github.com/flosch/pongo2"
	"github.com/gorilla/csrf"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	flags "github.com/jessevdk/go-flags"
	"github.com/jinzhu/gorm"

	_ "github.com/mattn/go-sqlite3"
)

func operation(opts *cmdOptions) error {
	if _, err := os.Stat(opts.StaticRoot); err != nil {
		return err
	}
	if _, err := os.Stat(opts.ViewRoot); err != nil {
		return err
	}
	if _, err := os.Stat(opts.WpDbPath); err != nil {
		return err
	}

	//DB
	{
		db, err := sql.Open("sqlite3", opts.WpDbPath+`?mode=ro`)
		if err != nil {
			return err
		}
		defer db.Close()
		pongo2.Globals[WikipDBKey] = db
		pongo2.Globals["maxResult"] = opts.MaxResult
		go func() {
			setTotal(db)
			log.Print("Count done.")
		}()
	}

	//Session
	{
		key := "a-secret-string"
		store := sessions.NewFilesystemStore(opts.TmpPath, []byte(key))
		pongo2.Globals["store"] = store
	}

	//sys DB
	if sdb, err := gorm.Open("sqlite3", opts.SysDbPath); err == nil {
		users := []User{}
		if len(opts.Users) != 0 {
			if raw, err := ioutil.ReadFile(opts.Users); err == nil {
				json.Unmarshal(raw, &users)
			} else {
				return err
			}
		}

		if err := initSDB(sdb, users); err != nil {
			return err
		}
		pongo2.Globals[SysDBKey] = sdb
		//         sdb.LogMode(true)
	} else {
		return err
	}

	// setup pongo
	pongo2.DefaultLoader.SetBaseDir(opts.ViewRoot)

	r := mux.NewRouter()
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(opts.StaticRoot))))
	r.HandleFunc("/", showTopPage)
	r.HandleFunc("/{query}", showTopPage)
	r.HandleFunc("/api/v1/text/{docid}", GetText)
	r.HandleFunc("/api/v1/search/{query}", GetTexts)

	r.HandleFunc("/user/login", userLogin).Methods("POST")
	r.HandleFunc("/user/logout", userLogout).Methods("POST")
	r.HandleFunc("/user/information", userShow).Methods("POST")
	r.HandleFunc("/user/register", userRegister).Methods("POST")
	r.HandleFunc("/annotation/qr/register", queryAnnotationRegister).Methods("POST")
	r.HandleFunc("/annotation/qr/show/mine", queryAnnotationShowMinePage).Methods("GET")
	r.HandleFunc("/annotation/qr/show/mine/{query}.json", queryAnnotationShow).Methods("POST")
	r.HandleFunc("/annotation/ma/register", maAnnotationRegister).Methods("POST")
	r.HandleFunc("/annotation/ma/show/mine", maAnnotationShowMinePage).Methods("GET")
	r.HandleFunc("/annotation/ma/show/mine/{docid}.json", maAnnotationShow).Methods("POST")
	r.HandleFunc("/redirect/ma/{query}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		q := vars["query"]
		http.Redirect(w, r, opts.MaBind+"/"+q, http.StatusFound)
	})

	log.Printf("Server started at [%s] from pid %d", opts.Bind, os.Getpid())
	{
		// All POST requests without a valid token will return HTTP 403 Forbidden.
		sf := csrf.Secure(false) //FIXME (use this when developing locally over plain HTT)
		CSRF := csrf.Protect([]byte("32-byte-long-auth-key"), sf)
		cr := CSRF(r)

		loggedRouter := handlers.CombinedLoggingHandler(os.Stdout, cr)

		// Wrap our server with our gzip handler to gzip compress ALL responses.
		// TODO: exclude some binary files like image files
		gh := handlers.CompressHandler(loggedRouter)

		gracehttp.Serve(&http.Server{Addr: opts.Bind, Handler: gh})
	}
	return nil
}

type cmdOptions struct {
	Help       bool   `short:"h" long:"help" description:"Show this help message"`
	WpDbPath   string `short:"w" long:"wikipedia" required:"true" description:"Path to the Wikipedia Database"`
	SysDbPath  string `short:"s" long:"sys" required:"true" description:"Path to the sys Database"`
	Bind       string `short:"b" long:"bind" default:":8000" description:"String to bind"`
	TmpPath    string `long:"tmp" default:"" description:"The path to the temporary directory"`
	Users      string `long:"users" default:"" description:"The path to user definition JSON file"`
	MaBind     string `long:"ma" default:"" description:"URL of macomp-server"`
	StaticRoot string `long:"static" default:"" description:"The path to the static directory"`
	ViewRoot   string `long:"view" default:"" description:"The path to the view directory"`
	MaxResult  int    `long:"maxresult" default:"9999" description:"Max result limit"`
}

func main() {
	opts := cmdOptions{}
	optparser := flags.NewParser(&opts, flags.Default)
	optparser.Name = ""
	optparser.Usage = ""
	_, err := optparser.Parse()

	//show help
	if err != nil {
		for _, arg := range os.Args {
			if arg == "-h" || arg == "--help" {
				PrintDefaultPath()
				os.Exit(0)
			}
		}
		//         fmt.Fprintf(os.Stderr, "%s\n", err.Error())
		os.Exit(1)
	}

	if len(opts.StaticRoot) == 0 {
		opts.StaticRoot = GetStaticRootPath()
	}
	if len(opts.ViewRoot) == 0 {
		opts.ViewRoot = GetViewRootPath()
	}

	if len(opts.TmpPath) == 0 {
		dir, err := ioutil.TempDir("", "morant")
		if err != nil {
			log.Fatal(err)
		}
		opts.TmpPath = dir
	} else {
		if err := os.MkdirAll(opts.TmpPath, 0700); err != nil {
			log.Fatal(err)
		}
	}
	log.Printf("Temp path is: [%s]", opts.TmpPath)
	log.Printf("[WARN] The directory is not deleted automatically")

	if err := operation(&opts); err != nil {
		log.Fatal(err)
	}
}
