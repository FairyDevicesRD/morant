package main

import (
	"database/sql"
	"log"
	"net/http"

	humanize "github.com/flosch/go-humanize"
	"github.com/flosch/pongo2"
	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
)

var total int64
var totalHumanize string

func setTotal(db *sql.DB) {
	rows, err := db.Query(`select count(*) from wikip;`)
	if err != nil {
		log.Fatal(err)
	}

	rows.Next()
	if err := rows.Scan(&total); err != nil {
		log.Fatal(err)
	}
	totalHumanize = humanize.Comma(total)
}

// shotTopPage displays title
func showTopPage(w http.ResponseWriter, r *http.Request) {
	tpl, err := pongo2.DefaultSet.FromFile("index.tpl")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	vars := mux.Vars(r)
	ctx := pongo2.Context{
		"totalHumanize": totalHumanize,
		"query":         vars["query"],
		"maxResult":     pongo2.Globals["maxResult"],
		"csrfToken":     csrf.Token(r),
	}
	tpl.ExecuteWriter(ctx, w)
}
