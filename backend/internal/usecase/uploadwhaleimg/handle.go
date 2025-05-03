package uploadwhaleimg

import (
	"context"
	"errors"
	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (uc UC) Handle(ctx context.Context, cmd Command) (string, error) {
	imageInfo, err := uc.imageStorageRepo.SaveImage(ctx, cmd.Img)
	if err != nil {
		return "", err
	}

	if err = uc.recognizerRepo.RecognizeWhale(ctx, imageInfo.URL); err != nil {
		deleteError := uc.imageStorageRepo.DeleteImage(ctx, imageInfo.ObjectID.String())

		return "", errors.Join(err, deleteError)
	}

	whale := domain.NewHumpbackWhale(
		cmd.AuthorID,
		cmd.Longitude,
		cmd.Latitude,
		cmd.Description,
		imageInfo.ObjectID,
		cmd.SawAt,
		"",
		"",
		cmd.WhaleTypeID,
	)

	if err = uc.humpbackWhaleRepo.SaveWhale(ctx, whale); err != nil {
		deleteError := uc.imageStorageRepo.DeleteImage(ctx, imageInfo.ObjectID.String())

		return "", errors.Join(err, deleteError)
	}

	return imageInfo.URL, nil
}
