package main

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/flosch/pongo2"
	"github.com/gorilla/sessions"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

const (
	//SessionName is a session name
	SessionName = "session-name"
	//SysDBKey is the key
	SysDBKey = "SysDBKey"
)

//User implements user information
type User struct {
	UID            int    `gorm:"primary_key"`
	ID             string `sql:"not null;unique"`
	RawPassword    string `gorm:"-"`
	BcryptPassword []byte `sql:"not null"`
	ScreenName     string `sql:"not null"`
}

func initSDB(sdb *gorm.DB, users []User) error {
	sdb.AutoMigrate(&User{})
	sdb.AutoMigrate(&QueryAnnotation{})
	sdb.AutoMigrate(&MaAnnotation{})

	for _, user := range users {
		if bcpw, err := bcrypt.GenerateFromPassword([]byte(user.RawPassword), 10); err == nil {
			user.BcryptPassword = bcpw
		} else {
			return err
		}
		if sdb.Where(User{ID: user.ID}).Assign(user).FirstOrCreate(&user); sdb.Error != nil {
			return sdb.Error
		}
	}

	return nil
}

func getSysSession(r *http.Request) (*sessions.Session, error) {
	store := pongo2.Globals["store"].(*sessions.FilesystemStore)
	session, err := store.Get(r, SessionName)
	if err != nil {
		return nil, err
	} else if session == nil {
		return nil, errors.New("Nil session store")
	}
	return session, nil
}

func getUID(session *sessions.Session) (uid int, err error) {
	if session == nil {
		err = errors.New("Invalid session")
		return
	}
	uidVal, _ := session.Values["uid"]
	switch v := uidVal.(type) {
	case int:
		uid = v
	default:
		err = errors.New("Unauthorized")
	}
	return
}

func userShow(w http.ResponseWriter, r *http.Request) {
	session, err := getSysSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	id, _ := session.Values["id"]
	uid, _ := session.Values["uid"]
	scn, _ := session.Values["ScreenName"]

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	rets := map[string]interface{}{
		"id":         id,
		"uid":        uid,
		"ScreenName": scn,
	}
	encoder.Encode(&rets)
}

func userLogin(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()

	id, password := r.Form.Get("id"), r.Form.Get("password")
	if len(id) == 0 || len(password) == 0 {
		http.Error(w, "Invalid zero length request", http.StatusBadRequest)
		return
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	user := new(User)
	sdb.Where("id = ?", id).First(user)
	if err := bcrypt.CompareHashAndPassword(user.BcryptPassword, []byte(password)); err == nil {
		session, err := getSysSession(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		session.Values["id"] = user.ID
		session.Values["uid"] = user.UID
		session.Values["ScreenName"] = user.ScreenName
		session.Save(r, w)

		userShow(w, r)
		return
	}

	http.Error(w, "Invalid id or password", http.StatusUnauthorized)
	return
}

func userLogout(w http.ResponseWriter, r *http.Request) {
	session, err := getSysSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	delete(session.Values, "id")
	delete(session.Values, "uid")
	session.Save(r, w)

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	rets := map[string]interface{}{"status": "OK", "login": false}
	encoder.Encode(&rets)
}

func userRegister(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()

	id, password, ScreenName := r.Form.Get("id"), r.Form.Get("password"), r.Form.Get("ScreenName")
	if len(id) == 0 || len(password) == 0 || len(ScreenName) == 0 {
		http.Error(w, "Invalid zero length request", http.StatusBadRequest)
		return
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	user := new(User)
	if sdb.Where("id = ?", id).First(user).RecordNotFound() {
		user.ID = id
		user.ScreenName = id
		user.RawPassword = password
		if bcpw, err := bcrypt.GenerateFromPassword([]byte(user.RawPassword), 10); err == nil {
			user.BcryptPassword = bcpw
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if sdb.Create(&user); sdb.Error != nil {
			http.Error(w, sdb.Error.Error(), http.StatusBadRequest)
			return
		}
		return //OK
	}

	http.Error(w, "Id already exists", http.StatusBadRequest)

}
