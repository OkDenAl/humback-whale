package handler

import (
	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"github.com/gabriel-vasile/mimetype"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/usecase/uploadwhaleimg"
	"github.com/OkDenAl/humback-whale/pkg/logger"
)

// @BasePath /api/v1
// uploadImg godoc
// @Summary upload whale image
// @Schemes
// @Description upload whale image
// @Tags Whale
// @Accept multipart/form-data
// @Param image formData file true "File to upload"
// @Param latitude formData number false "Latitude"
// @Param longitude formData number false "Longitude"
// @Param saw_at formData number false "Saw at"
// @Param Authorization header string true "authorization bearer token"
// @Produce json
// @Success 200 {object} uploadImgResp
// @Failure 400 {object} httpError
// @Failure 500 {object} httpError
// @Router /private/whale/upload [post]
func (h Handler) uploadImg() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		req, err := getUploadImageReq(c)
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
			req.SawAt,
			req.Name,
			req.Gender,
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
			switch {
			case errors.Is(err, integrationerror.ErrRecognizeWhale):
				c.JSONP(
					http.StatusUnprocessableEntity,
					newError(err, http.StatusUnprocessableEntity),
				)
			default:
				c.JSONP(
					http.StatusInternalServerError,
					newError(errors.Wrap(err, "failed to upload image"), http.StatusInternalServerError),
				)
			}

			return
		}

		c.JSON(http.StatusOK, uploadImgResp{
			URL: url,
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

func getUploadImageReq(c *gin.Context) (*uploadImgReq, error) {
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

	authorID := c.GetHeader("X-Auth-ID")
	if authorID == "" {
		return nil, errors.WithStack(errors.Errorf("failed to get author id"))
	}

	var sawAt time.Time
	cursorStr := c.PostForm("saw_at")
	if cursorStr != "" {
		sawAt, err = time.Parse(time.DateOnly, cursorStr)
		if err != nil {
			return nil, errors.Wrap(err, "failed to parse cursor")
		}
	}

	return &uploadImgReq{
		Img:         img,
		Longitude:   longitude,
		Latitude:    latitude,
		Description: c.PostForm("description"),
		WhaleType:   c.PostForm("whale_type"),
		Gender:      c.PostForm("gender"),
		Name:        c.PostForm("name"),
		AuthorID:    authorID,
		SawAt:       sawAt,
	}, nil
}

type uploadImgReq struct {
	Img         []byte
	Longitude   float64
	Latitude    float64
	SawAt       time.Time
	Description string
	WhaleType   string
	AuthorID    string
	Name        string
	Gender      string
}

type uploadImgResp struct {
	URL string `json:"url"`
}
