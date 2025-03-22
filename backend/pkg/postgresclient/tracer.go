package postgresclient

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type tracerAggregator []pgx.QueryTracer

func (ta tracerAggregator) TraceQueryStart(
	ctx context.Context,
	conn *pgx.Conn,
	data pgx.TraceQueryStartData,
) context.Context {
	for _, t := range ta {
		ctx = t.TraceQueryStart(ctx, conn, data)
	}

	return ctx
}

func (ta tracerAggregator) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	for _, t := range ta {
		t.TraceQueryEnd(ctx, conn, data)
	}
}
