package main

import (
	"compress/gzip"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"

	"golang.org/x/text/width"

	"github.com/flosch/pongo2"
	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
)

//QueryAnnotation stores users' annotation
type QueryAnnotation struct {
	ID               int    `gorm:"primary_key"`
	UID              int    `sql:"type:int" gorm:"unique_index:idx_name_code"`
	Docid            int    `sql:"type:int" gorm:"unique_index:idx_name_code"`
	Query            string `sql:"type:text" gorm:"unique_index:idx_name_code"`
	Type             int    `sql:"not null"`
	Comment          string
	MatchSegmentSurf string
	MatchSegmentPos  string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func queryAnnotationShow(w http.ResponseWriter, r *http.Request) {
	session, err := getSysSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	uid, err := getUID(session)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	ants := []QueryAnnotation{}
	a := QueryAnnotation{UID: uid}

	vars := mux.Vars(r)
	query := vars["query"]
	if query != "all" {
		a.Query = width.Widen.String(query)
	}
	sdb.Where(a).Find(&ants)

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.Encode(ants)
}

func queryAnnotationRegister(w http.ResponseWriter, r *http.Request) {
	session, err := getSysSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	uid, err := getUID(session)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var b []byte
	if r.Header.Get("Content-Encoding") == "gzip" {
		r.Header.Del("Content-Length")

		if zr, err := gzip.NewReader(r.Body); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else if b, err = ioutil.ReadAll(zr); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		if b, err = ioutil.ReadAll(r.Body); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	var annotations []QueryAnnotation
	if err := json.Unmarshal(b, &annotations); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	for _, ant := range annotations {
		//TODO validate submitted data
		ant.Query = width.Widen.String(ant.Query)
		if (ant.Type == 0) && len(ant.Comment) == 0 {
			sdb.Where(QueryAnnotation{UID: ant.UID, Docid: ant.Docid, Query: ant.Query}).Delete(QueryAnnotation{})
		} else {
			ant.UID = uid
			sdb.Where(QueryAnnotation{UID: ant.UID, Docid: ant.Docid, Query: ant.Query}).Assign(map[string]interface{}{"type": ant.Type, "comment": ant.Comment}).FirstOrCreate(&ant)
		}
	}

	w.Write([]byte(`{"status": "OK"}`))
}

func queryAnnotationShowMinePage(w http.ResponseWriter, r *http.Request) {
	tpl, err := pongo2.DefaultSet.FromFile("qr-annotations.tpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := pongo2.Context{
		"csrfToken": csrf.Token(r),
		"title":     "あなたのクエリアノテーション一覧",
	}
	tpl.ExecuteWriter(ctx, w)
}
