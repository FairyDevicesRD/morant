package main

import (
	"sort"
	"strings"
)

func getMatchSegmentsExpr(text, key string, positions []int) (int, int) {
	spanStart := strings.Index(text, key)
	spanStart = len([]rune(text[:spanStart]))
	spanEnd := spanStart + len([]rune(key)) - 1

	textStartIdx := sort.Search(len(positions), func(i int) bool { return positions[i] > spanStart }) - 1
	textEndIdx := sort.Search(len(positions), func(i int) bool { return positions[i] > spanEnd })
	return textStartIdx, textEndIdx
}
