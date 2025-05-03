package updateimginfo

import (
	"context"
)

func (uc UC) Handle(ctx context.Context, cmd Command) error {
	whale, err := uc.humpbackWhaleRepo.GetWhaleByID(ctx, cmd.ImgID)
	if err != nil {
		return err
	}

	whale.Describe(cmd.Description)
	whale.SpecifyWhaleType(cmd.WhaleTypeID)
	whale.SpecifyName(cmd.Name)
	whale.SpecifyGender(cmd.Gender)

	return uc.humpbackWhaleRepo.SaveWhale(ctx, whale)
}
