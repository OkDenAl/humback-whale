package miniorepo

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"io"
	"net/url"
	"sync"
	"testing"
	"time"
)

// MinioClientMock представляет мок для minio.Client
type MinioClientMock struct {
	PresignedGetObjectFunc func(ctx context.Context, bucketName, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error)
}

func (m *MinioClientMock) RemoveObject(ctx context.Context, bucketName, objectName string, opts minio.RemoveObjectOptions) error {
	//TODO implement me
	panic("implement me")
}

func (m *MinioClientMock) PutObject(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64, opts minio.PutObjectOptions) (minio.UploadInfo, error) {
	//TODO implement me
	panic("implement me")
}

// PresignedGetObject имплементирует метод из интерфейса minio.Client
func (m *MinioClientMock) PresignedGetObject(ctx context.Context, bucketName, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error) {
	return m.PresignedGetObjectFunc(ctx, bucketName, objectName, expires, reqParams)
}

func TestRepo_GetMany(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		// Arrange
		url1, _ := url.Parse("https://example.com/url1")
		url2, _ := url.Parse("https://example.com/url2")
		url3, _ := url.Parse("https://example.com/url3")

		u1 := uuid.New()
		u2 := uuid.New()
		u3 := uuid.New()

		callCount := 0
		var mu sync.Mutex
		mockMinioClient := &MinioClientMock{
			PresignedGetObjectFunc: func(ctx context.Context, bucketName, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error) {
				assert.Equal(t, "test-bucket", bucketName)
				assert.Equal(t, time.Second*24*60*60, expires)

				mu.Lock()
				callCount++
				mu.Unlock()
				switch objectName {
				case u1.String():
					return url1, nil
				case u2.String():
					return url2, nil
				case u3.String():
					return url3, nil
				default:
					return nil, errors.New("unexpected object name")
				}
			},
		}

		repo := &Repo{
			db:         mockMinioClient,
			bucketName: "test-bucket",
		}

		ctx := context.Background()
		objectIDs := []uuid.UUID{u1, u2, u3}

		// Act
		results, err := repo.GetMany(ctx, objectIDs)

		// Assert
		require.NoError(t, err)
		assert.Len(t, results, 3)
		assert.Equal(t, 3, callCount, "PresignedGetObject должен быть вызван 3 раза")

		// Порядок URL в результате может отличаться из-за конкурентного выполнения
		expectedURLs := []domain.ImageInfo{
			{
				ObjectID: u1,
				URL:      url1.String(),
			},
			{
				ObjectID: u2,
				URL:      url2.String(),
			},
			{
				ObjectID: u3,
				URL:      url3.String(),
			},
		}
		for _, u := range results {
			assert.Contains(t, expectedURLs, u)
		}
	})

	t.Run("error from one request", func(t *testing.T) {
		t.Parallel()
		// Arrange
		url1, _ := url.Parse("https://example.com/url1")
		expectedErr := errors.New("minio error")

		u1 := uuid.New()
		u2 := uuid.New()
		u3 := uuid.New()

		mockMinioClient := &MinioClientMock{
			PresignedGetObjectFunc: func(ctx context.Context, bucketName, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error) {
				if objectName == u2.String() {
					return nil, expectedErr
				}
				return url1, nil
			},
		}

		repo := &Repo{
			db:         mockMinioClient,
			bucketName: "test-bucket",
		}

		ctx := context.Background()
		objectIDs := []uuid.UUID{u1, u2, u3}

		// Act
		results, err := repo.GetMany(ctx, objectIDs)

		// Assert
		require.Error(t, err)
		assert.Nil(t, results)
		assert.Contains(t, err.Error(), "failed to get many url")
	})

	t.Run("empty object ids", func(t *testing.T) {
		t.Parallel()
		// Arrange
		mockMinioClient := &MinioClientMock{
			PresignedGetObjectFunc: func(ctx context.Context, bucketName, objectName string, expires time.Duration, reqParams url.Values) (*url.URL, error) {
				t.Fatal("Не должно быть вызовов PresignedGetObject")
				return nil, nil
			},
		}

		repo := &Repo{
			db:         mockMinioClient,
			bucketName: "test-bucket",
		}

		ctx := context.Background()

		// Act
		results, err := repo.GetMany(ctx, []uuid.UUID{})

		// Assert
		require.NoError(t, err)
		assert.Empty(t, results)
	})
}
