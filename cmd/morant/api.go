package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"golang.org/x/text/width"

	"github.com/flosch/pongo2"
	"github.com/gorilla/mux"
)

const (
	//WikipDBKey is the key for the Wikipedia DB
	WikipDBKey = "WikipDB"
)

//GetText returns Text whose docid is a query docid.
func GetText(w http.ResponseWriter, r *http.Request) {
	db := pongo2.Globals[WikipDBKey].(*sql.DB)

	vars := mux.Vars(r)
	docid, err := strconv.Atoi(vars["docid"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`SELECT curid, text FROM wikip WHERE id=?`, docid)
	if err != nil {
		http.Error(w, "SQL error", http.StatusBadRequest)
		return
	}
	defer rows.Close()

	out := struct {
		Curid int
		Text  string
	}{}
	rows.Next()
	if err := rows.Scan(&out.Curid, &out.Text); err != nil {
		http.Error(w, "No such docid record", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.Encode(out)
}

func getBigram(text string) []rune {
	inRunes := []rune(text)

	if len(inRunes) <= 1 {
		return nil
	}

	rets := make([]rune, 3*len(inRunes)-4)
	for i, c := range inRunes {
		if i == 0 {
			rets[i] = c
		} else if i == len(inRunes)-1 {
			rets[len(rets)-1] = c
		} else {
			rets[i*3] = c
			rets[i*3-2] = c
			rets[i*3-1] = ' '
		}
	}
	return rets
}

//GetTexts returns texts which contain a designated substring
func GetTexts(w http.ResponseWriter, r *http.Request) {
	db := pongo2.Globals[WikipDBKey].(*sql.DB)

	vars := mux.Vars(r)
	query := vars["query"]
	if len(query) == 0 {
		http.Error(w, "Query is not specified", http.StatusBadRequest)
		return
	}
	query = width.Widen.String(query)
	bigram := getBigram(query)
	if bigram == nil {
		http.Error(w, "Invalid query length", http.StatusBadRequest)
		return
	}
	key := `'"` + string(bigram) + `"'`

	sqlQuery := `SELECT wb.docid, curid, text, wm.words, w.positions, w.pos0s
        FROM (wikip w 
         INNER JOIN wikip_cbi_fts wb ON w.id = wb.docid )
        INNER JOIN wikip_mecab_fts wm ON w.id = wm.docid
        WHERE wb.words MATCH ? LIMIT ?`

	rows, err := db.Query(sqlQuery, key, pongo2.Globals["maxResult"])
	if err != nil {
		http.Error(w, "SQL error", http.StatusBadRequest)
		return
	}
	defer rows.Close()

	{
		type Result struct {
			Docid      int
			Curid      int
			Text       string
			MaWords    string
			Positions  []int
			Words      []string
			Poss       []string
			MatchStart int
			MatchEnd   int
		}

		outs := make([]Result, 0)
		for rows.Next() {
			item := Result{}
			var positionsJSON string
			var pos0sJSON string

			err = rows.Scan(&item.Docid, &item.Curid, &item.Text, &item.MaWords, &positionsJSON, &pos0sJSON)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			{
				if err := json.Unmarshal(([]byte)(positionsJSON), &item.Positions); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				if err := json.Unmarshal(([]byte)(pos0sJSON), &item.Poss); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				item.MatchStart, item.MatchEnd = getMatchSegmentsExpr(item.Text, query, item.Positions)
			}
			{
				runeText := []rune(item.Text)
				length := len(item.Positions) - 1
				item.Words = make([]string, length)
				for i := 0; i < length; i++ {
					wordStart := item.Positions[i]
					wordEnd := item.Positions[i+1]
					word := string(runeText[wordStart:wordEnd])
					item.Words[i] = word
				}
			}
			outs = append(outs, item)
		}

		w.Header().Set("Content-Type", "application/json")
		encoder := json.NewEncoder(w)
		encoder.Encode(outs)
	}
}
