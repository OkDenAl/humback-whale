package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"github.com/OkDenAl/humback-whale/internal/integrationerror"
	"github.com/OkDenAl/humback-whale/internal/usecase/getimages"
	"github.com/OkDenAl/humback-whale/pkg/logger"
	"github.com/OkDenAl/humback-whale/pkg/ptr"
)

// @BasePath /api/v1
// getImages godoc
// @Summary get images with filters
// @Schemes
// @Description get whale images with pagination and filters
// @Tags Whale
// @Param limit query int true "Limit per page"
// @Param cursor query string false "Timestamp cursor (RFC3339Nano format) for pagination"
// @Param username query string false "Filter by author username"
// @Param whale_type_id query string false "Filter by whale type id"
// @Param start_time query string false "Filter by start time (RFC3339Nano format)"
// @Param end_time query string false "Filter by end time (RFC3339Nano format)"
// @Produce json
// @Success 200 {object} getImagesResp "Successful response with whale images"
// @Failure 400 {object} httpError "Bad request (invalid parameters)"
// @Failure 404 {object} httpError "Not found (no images match filters)"
// @Failure 401 {object} httpError
// @Failure 500 {object} httpError "Internal server error"
// @Router /public/whale/images [get]
func (h Handler) getImages() gin.HandlerFunc {
	return func(c *gin.Context) {
		log := logger.New()

		req, err := getGetImagesReq(c)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to parse request for get images")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to parse request for get images"), http.StatusBadRequest),
			)
			return
		}

		q, err := getimages.NewQuery(
			req.Limit,
			req.Cursor,
			req.Username,
			req.WhaleTypeID,
			req.StartTimePeriod,
			req.EndTimePeriod,
			req.Gender,
			req.WhaleName,
		)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to create query for get images")
			c.JSON(
				http.StatusBadRequest,
				newError(errors.Wrap(err, "failed to create query for get images"), http.StatusBadRequest),
			)
			return
		}

		res, err := h.getWhaleImageUC.Handle(c, q)
		if err != nil {
			log.Error().Stack().Err(err).Msg("failed to get images")
			switch {
			case errors.Is(err, integrationerror.ErrHumpbackWhaleNotFound):
				c.JSON(
					http.StatusNotFound,
					newError(errors.Wrap(err, "failed to get images"), http.StatusNotFound),
				)
			default:
				c.JSONP(
					http.StatusInternalServerError,
					newError(errors.Wrap(err, "failed to get images"), http.StatusInternalServerError),
				)
			}

			return
		}

		c.JSON(http.StatusOK, getImagesResp{
			WhaleImgs:   res.WhaleImgs,
			NextPageURL: res.NextPageURL,
			PrevPageURL: res.PrevPageURL,
		})
	}
}

func getGetImagesReq(c *gin.Context) (getImagesReq, error) {
	limitStr := c.Query("limit")
	if limitStr == "" {
		return getImagesReq{}, errors.Errorf("limit is required")
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		return getImagesReq{}, errors.Wrap(err, "failed to parse limit")
	}

	var cursor time.Time
	cursorStr := c.Query("cursor")
	if cursorStr != "" {
		cursor, err = time.Parse(time.RFC3339Nano, cursorStr)
		if err != nil {
			return getImagesReq{}, errors.Wrap(err, "failed to parse cursor")
		}
	}

	var (
		startTime time.Time
		endTime   time.Time
	)
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	if startTimeStr != "" && endTimeStr != "" {
		startTime, err = time.Parse(time.RFC3339Nano, startTimeStr)
		if err != nil {
			return getImagesReq{}, errors.Wrap(err, "failed to parse start time")
		}

		endTime, err = time.Parse(time.RFC3339Nano, endTimeStr)
		if err != nil {
			return getImagesReq{}, errors.Wrap(err, "failed to parse end time")
		}
	}

	if (startTimeStr != "" && endTimeStr == "") || (startTimeStr == "" && endTimeStr != "") {
		return getImagesReq{}, errors.Errorf("start_time and end_time must be set together")
	}

	return getImagesReq{
		Limit:           limit,
		Cursor:          ptr.NilIfZero(cursor),
		Username:        ptr.NilIfZero(c.Query("username")),
		WhaleTypeID:     ptr.NilIfZero(c.Query("whale_type_id")),
		Gender:          ptr.NilIfZero(c.Query("gender")),
		WhaleName:       ptr.NilIfZero(c.Query("name")),
		StartTimePeriod: ptr.NilIfZero(startTime),
		EndTimePeriod:   ptr.NilIfZero(endTime),
	}, nil
}

type getImagesReq struct {
	Limit           int
	Cursor          *time.Time
	Username        *string
	WhaleTypeID     *string
	StartTimePeriod *time.Time
	EndTimePeriod   *time.Time
	Gender          *string
	WhaleName       *string
}

type getImagesResp struct {
	WhaleImgs   []getimages.HumpbackWhaleImage `json:"whale_images"`
	NextPageURL *string                        `json:"next_page_url,omitempty"`
	PrevPageURL *string                        `json:"prev_page_url,omitempty"`
}
