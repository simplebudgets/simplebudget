import React from 'react';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import {
    dialogPaperStyles,
    themes,
    useGlobalStore
} from "../store/globalStore";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from "@mui/material/CssBaseline";
import Grid from '@mui/material/Grid';
import Dialog from "@mui/material/Dialog";
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { supabase } from "../lib/supabase";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import logo from "../logo.png";
import Stack from "@mui/material/Stack";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [errorText, setErrorText] = React.useState('');
    const [success, setSuccess] = React.useState(false);
    const [loadingOpen, setLoadingOpen] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const currentTheme = useGlobalStore(s => s.themeAtom);

    const handleClickShowPassword = () => setShowPassword(!showPassword);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setErrorText('');

        if (newPassword.length < 8) {
            setErrorText('Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorText('Passwords do not match');
            return;
        }

        setLoadingOpen(true);

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        setLoadingOpen(false);

        if (error) {
            setErrorText(error.message);
            return;
        }

        setSuccess(true);
    }

    const [actTheme, setTheme] = React.useState(themes.darkTheme);
    React.useEffect(() => {
        if (currentTheme === 'dark') {
            setTheme(themes.darkTheme);
        } else if (currentTheme === 'light') {
            setTheme(themes.lightTheme);
        }
    }, [currentTheme]);

    return (
        <ThemeProvider theme={actTheme}>
            <CssBaseline />
            <Box sx={{
                width: '100%',
                height: window.innerHeight,
                backgroundColor: 'primary.light',
            }} />
            <Dialog open={true} slotProps={{ paper: dialogPaperStyles }}>
                <Box
                    component='form'
                    onSubmit={handleSubmit}
                    sx={{
                        bgcolor: 'background.paper',
                        px: 3,
                        pb: 5,
                        pt: 3,
                        maxWidth: '300px'
                    }}
                >
                    <Grid container rowSpacing={2}>
                        <Grid size={12} sx={{ my: 5 }}>
                            <Stack direction='row' alignItems='center'>
                                <img
                                    height='50'
                                    src={logo}
                                    srcSet={`${logo}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                    alt='logo'
                                    loading="lazy"
                                />
                                <Typography variant="h5" color='textSecondary' sx={{ ml: 1, fontWeight: 100 }}>simple</Typography>
                                <Typography variant="h5" align="left">Budget</Typography>
                            </Stack>
                        </Grid>
                        {success ? (
                            <>
                                <Grid size={12} sx={{ mb: 1 }}>
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>Password updated</Typography>
                                    <Typography variant='body2' sx={{ mt: 1 }}>
                                        Your password has been reset successfully. You can now sign in with your new password.
                                    </Typography>
                                </Grid>
                                <Grid size={12}>
                                    <Button fullWidth variant='contained' onClick={() => navigate('/login', { replace: true })}>
                                        Go to Sign In
                                    </Button>
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid size={12} sx={{ mb: 0, pb: 1 }}>
                                    <Typography variant='body2'>Enter your new password below.</Typography>
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        autoFocus
                                        label="New Password"
                                        value={newPassword}
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowPassword}
                                                        onMouseDown={handleMouseDownPassword}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>,
                                            },
                                        }}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        label="Confirm New Password"
                                        value={confirmPassword}
                                        error={confirmPassword.length > 0 && newPassword !== confirmPassword}
                                        slotProps={{
                                            input: {
                                                endAdornment: <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={handleClickShowPassword}
                                                        onMouseDown={handleMouseDownPassword}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>,
                                            },
                                        }}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Typography variant='body2' color='error'>{errorText}</Typography>
                                </Grid>
                                <Grid size={12}>
                                    <Button
                                        fullWidth
                                        variant='contained'
                                        disabled={newPassword.length < 8}
                                        type='submit'
                                        sx={{ mt: 1 }}
                                    >
                                        Reset Password
                                    </Button>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </Box>
            </Dialog>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 200 }}
                open={loadingOpen}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </ThemeProvider>
    );
}
