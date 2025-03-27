package handler

import (
	"io"
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// getMarkup godoc
// @Summary get markup from text
// @Schemes
// @Description get markup from text
// @Tags Whale
// @Accept multipart/form-data
// @Param file formData file true "File to upload"
// @Param latitude formData int false "Latitude"
// @Param longitude formData int false "Longitude"
// @Param author_id  path string true "Author ID (uuid)"
// @Produce json
// @Success 200
// @Success 400 {object} httpError
// @Failure 500 {object} httpError
// @Router /private/upload/{author_id} [post]
func (h Handler) uploadImg() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		req, err := getReq(c)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse request")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse request"), http.StatusBadRequest),
			)
			return
		}

		cmd, err := uploadwhaleimg.NewCommand(
			req.Img,
			req.Longitude,
			req.Latitude,
			req.Description,
			req.WhaleType,
			req.AuthorID,
		)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to validate request data")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to validate request data"), http.StatusBadRequest),
			)
			return
		}

		url, err := h.uploadWhaleImageUC.Handle(c, cmd)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to upload image")
			c.JSONP(
				http.StatusInternalServerError,
				newError(errors.Wrap(err, "failed to upload image"), http.StatusInternalServerError),
			)
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"url": url,
		})
	}
}

func getDataFromFile(inputFile *multipart.FileHeader) ([]byte, error) {
	file, err := inputFile.Open()
	if err != nil {
		return nil, errors.Wrap(err, "failed to open input file")
	}

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, errors.Wrap(err, "failed to read input file")
	}

	if err = checkFileExtension(data); err != nil {
		return nil, err
	}

	return data, nil
}

func checkFileExtension(data []byte) error {
	var allowed = []string{
		"image/png",
		"image/jpeg",
	}

	mtype := mimetype.Detect(data)
	if !mimetype.EqualsAny(mtype.String(), allowed...) {
		return errors.Errorf("failed to validate input file")
	}

	return nil
}

func getReq(c *gin.Context) (*uploadImgReq, error) {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return nil, errors.Wrap(err, "failed to get request file")
	}
	img, err := getDataFromFile(fileHeader)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get file data")
	}

	var longitude float64
	longitudeReq := c.PostForm("longitude")
	if longitudeReq != "" {
		longitude, err = strconv.ParseFloat(longitudeReq, 64)
		if err != nil {
			return nil, errors.Wrap(err, "failed to get longitude")
		}
	}

	var latitude float64
	latitudeReq := c.PostForm("latitude")
	if latitudeReq != "" {
		latitude, err = strconv.ParseFloat(latitudeReq, 64)
		if err != nil {
			return nil, errors.Wrap(err, "failed to get latitude")
		}
	}

	return &uploadImgReq{
		Img:         img,
		Longitude:   longitude,
		Latitude:    latitude,
		Description: c.PostForm("description"),
		WhaleType:   c.PostForm("whale_type"),
		AuthorID:    c.Param("author_id"),
	}, nil
}

type uploadImgReq struct {
	Img         []byte
	Longitude   float64
	Latitude    float64
	Description string
	WhaleType   string
	AuthorID    string
}
