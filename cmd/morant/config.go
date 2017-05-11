package main

import (
	"fmt"
	"os"
	"path/filepath"
)

//GetMyPath returns the static root path
func GetMyPath(envname, dirname string) string {
	if path := os.Getenv(envname); len(path) != 0 {
		return path
	}
	if path := os.Getenv("GOPATH"); len(path) != 0 {
		spath := filepath.Join(path, "src", "github.com", "FairyDevicesRD", "morant", dirname)
		if _, err := os.Stat(spath); err == nil {
			return spath
		}
	}
	return ""
}

//GetStaticRootPath returns the static root path
func GetStaticRootPath() string {
	return GetMyPath("MORANT_STATIC", "static")
}

//GetViewRootPath returns the view root path
func GetViewRootPath() string {
	return GetMyPath("MORANT_VIEW", "view")
}

//PrintDefaultPath prints default paths
func PrintDefaultPath() {
	fmt.Printf("Default Path:\n")
	fmt.Printf("  Static root path: %s\n", GetStaticRootPath())
	fmt.Printf("  View   root path: %s\n", GetViewRootPath())
}
