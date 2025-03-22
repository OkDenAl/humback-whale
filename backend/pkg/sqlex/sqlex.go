package sqlex

import (
	"fmt"
	"strings"
)

func Select(s []string, mapFn func(string) string) []string {
	res := make([]string, 0, len(s))
	for _, v := range s {
		res = append(res, mapFn(v))
	}

	return res
}

type ConflictBuilder struct {
	conflictColumn []string
}

func OnConflict(column ...string) ConflictBuilder {
	return ConflictBuilder{conflictColumn: column}
}

func (cb ConflictBuilder) DoNothing() string {
	return fmt.Sprintf(`ON CONFLICT (%s) DO NOTHING`, strings.Join(cb.conflictColumn, ","))
}

func (cb ConflictBuilder) DoUpdateSet(column ...string) string {
	mainPart := fmt.Sprintf(`ON CONFLICT (%s) DO UPDATE SET `, strings.Join(cb.conflictColumn, ","))
	excludes := Select(column, func(s string) string { return fmt.Sprintf(`%[1]s = excluded.%[1]s`, s) })

	return mainPart + strings.Join(excludes, ", ")
}
