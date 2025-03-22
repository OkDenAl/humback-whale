package postgresclient

import (
	"context"
	"time"

	"github.com/OkDenAl/humback-whale/pkg/logger"
	"github.com/jackc/pgx/v5"
)

type (
	loggerTracer struct{}

	sqlDataKey struct{}

	sqlData struct {
		SQL   string
		Start time.Time
	}
)

func newLoggerTracer() loggerTracer {
	return loggerTracer{}
}

func (qt loggerTracer) TraceQueryStart(
	ctx context.Context,
	conn *pgx.Conn,
	data pgx.TraceQueryStartData,
) context.Context {
	return context.WithValue(
		ctx,
		sqlDataKey{},
		sqlData{
			SQL:   data.SQL,
			Start: time.Now(),
		},
	)
}

func (qt loggerTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	reqData, ok := ctx.Value(sqlDataKey{}).(sqlData)
	if !ok {
		return
	}

	log := logger.New()
	if data.Err != nil {
		log = log.With().Stack().Err(data.Err).Logger()
	}

	log.Info().
		Str("request_query", reqData.SQL).
		Dur("request_duration", time.Since(reqData.Start)).
		Bool("success", data.Err == nil).
		Msgf("sql query executed")
}
