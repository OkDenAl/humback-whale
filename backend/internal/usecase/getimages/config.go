package getimages

import (
	"strings"

	"github.com/pkg/errors"
)

const (
	limitTemplate  = "{limit}"
	cursorTemplate = "{cursor}"
)

type Config struct {
	GetWhaleImagesURLPageTemplate string `yaml:"url_page_template" validate:"required"`
}

func (cfg Config) Validate() error {
	if !strings.Contains(cfg.GetWhaleImagesURLPageTemplate, limitTemplate) {
		return errors.Errorf("%s template not found", limitTemplate)
	}
	if !strings.Contains(cfg.GetWhaleImagesURLPageTemplate, cursorTemplate) {
		return errors.Errorf("%s template not found", cursorTemplate)
	}

	return nil
}
