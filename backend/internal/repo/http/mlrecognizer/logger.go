package mlrecognizer

import (
	"bytes"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/OkDenAl/humback-whale/pkg/logger"
)

type LoggerTransport struct {
	rt http.RoundTripper
}

func NewLoggerTransport(parent http.RoundTripper) LoggerTransport {
	return LoggerTransport{
		rt: parent,
	}
}

func (lt LoggerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	start := time.Now()

	var reqBody []byte
	req.Body, reqBody = readBody(req.Body, req.Header)

	resp, err := lt.rt.RoundTrip(req)

	var (
		respBody   []byte
		statusCode int
		respHeader http.Header
	)
	if resp != nil {
		if resp.Body != nil {
			resp.Body, respBody = readBody(resp.Body, resp.Header)
		}
		statusCode = resp.StatusCode
		respHeader = resp.Header
	}

	log := logger.New()
	log.Info().
		Str("latency", time.Since(start).String()).
		Str("method:", req.Method).
		Str("path", req.Host).
		Str("path", req.URL.Path).
		Str("status_code", strconv.Itoa(statusCode)).
		Interface("request_headers", filterHeaders(req.Header)).
		Interface("request_body", reqBody).
		Interface("response_headers", filterHeaders(respHeader)).
		Interface("response_body", respBody).
		Msg("request processed successfully")

	return resp, err
}

var supportedHeaders = map[string]struct{}{
	"Authorization": {},
	"Referer":       {},
	"Content-Type":  {},
}

func filterHeaders(hdrs http.Header) http.Header {
	res := make(http.Header, len(supportedHeaders))
	for k, v := range hdrs {
		if _, ok := supportedHeaders[k]; ok {
			res[k] = v
		}
	}
	return res
}

func readBody(body io.ReadCloser, hdrs http.Header) (newBody io.ReadCloser, content []byte) {
	if !contentTypeIsJSON(hdrs) {
		return body, nil
	}

	bodyBytes, err := io.ReadAll(body)
	if err != nil {
		return body, nil
	}

	if err = body.Close(); err != nil {
		return body, nil
	}

	return io.NopCloser(bytes.NewBuffer(bodyBytes)), bodyBytes
}

func contentTypeIsJSON(hdrs http.Header) bool {
	if hdrs == nil {
		return false
	}

	return hdrs.Get("Content-Type") == "application/json"
}
