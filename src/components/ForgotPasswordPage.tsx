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
import { supabase } from "../lib/supabase";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import logo from "../logo.png";
import Stack from "@mui/material/Stack";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");
    const [errorText, setErrorText] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);
    const [loadingOpen, setLoadingOpen] = React.useState(false);
    const currentTheme = useGlobalStore(s => s.themeAtom);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setErrorText('');
        setLoadingOpen(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });

        setLoadingOpen(false);

        if (error) {
            setErrorText(error.message);
            return;
        }

        setSubmitted(true);
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
                        {submitted ? (
                            <>
                                <Grid size={12} sx={{ mb: 1 }}>
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>Check your email</Typography>
                                    <Typography variant='body2' sx={{ mt: 1 }}>
                                        If an account exists for {email}, you'll receive a password reset link shortly.
                                    </Typography>
                                </Grid>
                                <Grid size={12}>
                                    <Button fullWidth variant='contained' onClick={() => navigate('/login', { replace: true })}>
                                        Back to Sign In
                                    </Button>
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid size={12} sx={{ mb: 0, pb: 1 }}>
                                    <Typography variant='body2'>
                                        Enter your email and we'll send you a link to reset your password.
                                    </Typography>
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        type="email"
                                        autoFocus
                                        label="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Typography variant='body2' color='error'>{errorText}</Typography>
                                </Grid>
                                <Grid size={12}>
                                    <Button
                                        fullWidth
                                        variant='contained'
                                        disabled={email.length < 3}
                                        type='submit'
                                        sx={{ mt: 1 }}
                                    >
                                        Send Reset Link
                                    </Button>
                                </Grid>
                                <Grid size={12}>
                                    <Typography display='inline' variant='body2'>Remember your password? </Typography>
                                    <Button size='small' onClick={() => navigate('/login', { replace: true })}>Sign In</Button>
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
