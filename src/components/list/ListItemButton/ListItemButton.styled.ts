import { styled } from '@mui/system';

export const ListItemButtonStyled = styled('div')<{
  width: string;
  disableHover: boolean;
  primaryEllipsesLineClamp: any;
  secondaryEllipsesLineClamp: any;
}>(
  ({
    theme,
    width,
    disableHover,
    primaryEllipsesLineClamp,
    secondaryEllipsesLineClamp,
  }) => ({
    width: width || '100%',
    cursor: disableHover ? 'default' : 'pointer',
    '.list-item-btn': {
      borderRadius: '8px',
      '.MuiListItemText-root': {
        wordBreak: 'break-word',
        '.MuiListItemText-primary': {
          color: theme.palette.text.primary,
          wordBreak: 'break-all',
          ...(primaryEllipsesLineClamp
            ? {
                display: '-webkit-box',
                WebkitLineClamp: primaryEllipsesLineClamp,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            : {}),
        },
        '.MuiListItemText-secondary': {
          color: theme.palette.text.secondary,
          wordBreak: 'break-all',
          ...(secondaryEllipsesLineClamp
            ? {
                display: '-webkit-box',
                WebkitLineClamp: secondaryEllipsesLineClamp,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            : {}),
        },
      },
    },
    '.list-item-btn:hover': {
      backgroundColor: disableHover ? 'transparent' : theme.palette.grey[100],
      cursor: disableHover ? 'default' : 'pointer',
    },
    '.MuiButtonBase-root.MuiListItemButton-root.Mui-selected': {
      backgroundColor: theme.palette.primary.light,
      '.MuiListItemText-primary': {
        color: theme.palette.secondary.main,
      },
      '.list-item-icon': {
        color: theme.palette.secondary.main,
        outline: `1px solid ${theme.palette.secondary.main}`,
        backgroundColor: theme.palette.common.white,
      },
    },
  }),
);
