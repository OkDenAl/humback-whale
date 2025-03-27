package mlrecognizer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/pkg/errors"
)

type respRecognizeWhale struct {
	Result string `json:"result"`
}

func (c Repo) RecognizeWhale(ctx context.Context, url string) error {
	m := map[string]interface{}{
		"url": url,
	}
	reqJSON, err := json.Marshal(m)
	if err != nil {
		return errors.Wrap(err, "failed to marshal req data")
	}

	var req *http.Request
	req, err = http.NewRequestWithContext(
		ctx,
		"GET", fmt.Sprintf("%s/recognize", c.host),
		bytes.NewBuffer(reqJSON),
	)
	if err != nil {
		return errors.Wrapf(err, "failed to create http request to %s", req.URL.String())
	}

	clientResp, err := c.client.Do(req)
	if err != nil {
		return errors.Wrapf(err, "failed to send http request to %s", req.URL.String())
	}
	defer clientResp.Body.Close()

	if clientResp.StatusCode != http.StatusOK {
		return errors.Errorf("failed to recognize whale, status code: %d", clientResp.StatusCode)
	}

	var body []byte
	body, err = io.ReadAll(clientResp.Body)
	if err != nil {
		return errors.Wrap(err, "failed to read response body")
	}

	var resp respRecognizeWhale
	if err = json.Unmarshal(body, &resp); err != nil {
		return errors.Wrap(err, "failed to unmarshal response data")
	}

	if resp.Result != "OK" {
		return errors.Errorf("failed to recognize whale, result: %s", resp.Result)
	}

	return nil
}
