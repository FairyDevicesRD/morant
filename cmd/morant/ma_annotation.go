package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/flosch/pongo2"
	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
	"github.com/jinzhu/gorm"
)

//MaAnnotation stores users' annotation
type MaAnnotation struct {
	ID         int `gorm:"primary_key"`
	UID        int `sql:"type:int" gorm:"unique_index:idx_ma"`
	Docid      int `sql:"type:int" gorm:"unique_index:idx_ma"`
	Annotation string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func maAnnotationShow(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

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

	a := MaAnnotation{UID: uid}
	if docidStr, ok := vars["docid"]; !ok {
		http.Error(w, "Invalid docid request", http.StatusBadRequest)
		return
	} else if docidStr != "all" {
		docid, err := strconv.Atoi(docidStr)
		if err != nil {
			http.Error(w, "Invalid docid request", http.StatusBadRequest)
			return
		}
		a.Docid = docid
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	ants := []MaAnnotation{}

	sdb.Where(a).Find(&ants)

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.Encode(ants)
}

func maAnnotationRegister(w http.ResponseWriter, r *http.Request) {
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

	r.ParseForm()
	docidStr, ant := r.Form.Get("docid"), r.Form.Get("annotation")
	if len(docidStr) == 0 {
		http.Error(w, "Invalid docid request", http.StatusBadRequest)
		return
	}
	docid, err := strconv.Atoi(docidStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sdb := pongo2.Globals[SysDBKey].(*gorm.DB)
	if len(ant) == 0 {
		err = sdb.Where(MaAnnotation{UID: uid, Docid: docid}).Delete(MaAnnotation{}).Error
	} else {
		//TODO 検証
		err = sdb.Where(QueryAnnotation{UID: uid, Docid: docid}).Assign(map[string]interface{}{"annotation": ant}).FirstOrCreate(&MaAnnotation{}).Error
	}

	if err == nil {
		w.Write([]byte(`OK`))
	} else {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func maAnnotationShowMinePage(w http.ResponseWriter, r *http.Request) {
	tpl, err := pongo2.DefaultSet.FromFile("ma-annotations.tpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := pongo2.Context{
		"title":     "あなたの形態素アノテーション一覧",
		"csrfToken": csrf.Token(r),
	}
	tpl.ExecuteWriter(ctx, w)
}
