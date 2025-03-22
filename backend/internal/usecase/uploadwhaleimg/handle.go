package uploadwhaleimg

import (
	"context"
	"github.com/OkDenAl/humback-whale/internal/domain"
)

func (uc UC) Handle(ctx context.Context, cmd Command) (string, error) {
	imageInfo, err := uc.imageStorageRepo.SaveImage(ctx, cmd.Img)
	if err != nil {
		return "", err
	}

	if err = uc.recognizerRepo.RecognizeWhales(ctx, cmd.Img); err != nil {
		if err = uc.imageStorageRepo.DeleteImage(ctx, imageInfo.ObjectID.String()); err != nil {
			return "", err
		}

		return "", err
	}

	whale := domain.NewHumpbackWhale(
		cmd.AuthorID,
		cmd.Longitude,
		cmd.Latitude,
		cmd.Description,
		cmd.WhaleType,
		imageInfo.ObjectID,
	)

	if err = uc.humpbackWhaleRepo.SaveWhale(ctx, whale); err != nil {
		if err = uc.imageStorageRepo.DeleteImage(ctx, imageInfo.ObjectID.String()); err != nil {
			return "", err
		}

		return "", err
	}

	return imageInfo.URL, nil
}
