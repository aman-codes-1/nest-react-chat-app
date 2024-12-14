import { minWidth, styled } from '@mui/system';

export const HomeStyled = styled('div')(({ theme }) => ({
  backgroundImage: 'url(/assets/images/cool-background.svg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  width: '100%',
  height: '100svh',
  zIndex: '-1',
  userSelect: 'none',
  '.home-header': {
    marginTop: '11rem',
    padding: '0px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.625rem',
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      gap: '0.5rem',
    },
    '.home-heading': {
      fontSize: '3.625rem',
      color: theme.palette.common.white,
      textShadow: `0 1px 0 ${theme.palette.grey[50]}`,
      [theme.breakpoints.down('sm')]: {
        fontSize: '2.75rem',
      },
    },
    '.home-sub-heading': {
      lineHeight: '32px',
      fontSize: '1.25rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '1.125rem',
      },
    },
    '.home-login-btn-wrapper': {
      margin: '1rem 0rem',
      [theme.breakpoints.down('sm')]: {
        margin: '0.875rem 0rem',
      },
    },
  },
  '.home-footer': {
    padding: '0px 30px',
    position: 'fixed',
    bottom: 0,
    marginBottom: '0.5rem',
    textAlign: 'center',
    '.home-footer-sub-heading': {
      fontSize: '0.9125rem',
    },
  },
}));
