import React from 'react';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button"
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
import { supabase, isCustomSupabaseConfig, isSelfHostedConfig } from "../lib/supabase";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import logo from "../logo.png";
import Stack from "@mui/material/Stack";
import Chip from '@mui/material/Chip';
import StorageIcon from '@mui/icons-material/Storage';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const setCurrentUser = useGlobalStore(s => s.setCurrentUser)
    const [errorText, setErrorText] = React.useState('')
    const setSnackText = useGlobalStore(s => s.setSnackBarText)
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity)
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen)
    const [loadingOpen, setLoadingOpen] = React.useState(false);
    async function supaSignIn() {
        setLoadingOpen(true)
        let { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        if (error !== null) {
            setErrorText(error.message)
            setLoadingOpen(false)
            return false
        }
        let { data: users } = await supabase
            .from('users')
            .select('fullName,userType')
            .eq('recordID', data.user!.id)
        if (users) {
            await setCurrentUser(
                {
                    recordID: data.user!.id,
                    fullName: users[0].fullName,
                    userType: users[0].userType,
                }
            )
            localStorage.setItem('fullName', users[0].fullName)
            if (errorText === '') {
                navigate("/budget", { replace: true });
                setSnackSev('success')
                setSnackText('Login Successful')
                setSnackOpen(true)
            }
            setLoadingOpen(false)
            return
        }
    }
    function validateForm() {
        return (email.length > 0 && password.length > 0)
    }
    const currentTheme = useGlobalStore(s => s.themeAtom);
    const handleRedirectSignIn = (event: any) => {
        event.preventDefault();
        navigate("/signup", { replace: true });
    }
    const handleSubmit = (event: any) => {
        event.preventDefault();
        setErrorText('')
        supaSignIn()
    }
    const [actTheme, setTheme] = React.useState(themes.darkTheme)
    React.useEffect(() => {
        if (currentTheme === 'dark') {
            setTheme(themes.darkTheme)
        } else if (currentTheme === 'light') {
            setTheme(themes.lightTheme)
        }
    }, [currentTheme]);
    const [showPassword, setShowPassword] = React.useState(false)
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword)
    };
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    return (
        <>
            <ThemeProvider theme={actTheme}>
                <CssBaseline />
                <Box sx={{
                    width: '100%',
                    height: window.innerHeight,
                    backgroundColor: 'primary.light',
                }}>
                </Box>
                <Dialog open={true}
                    slotProps={{ paper: dialogPaperStyles }}>
                    <Box component='form'
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
                                    <Typography variant="h5" align="left" >
                                        Budget
                                    </Typography>
                                </Stack>
                            </Grid>
                            <Grid size={12} sx={{ mb: 0, pb: 1 }}>
                                <Typography variant='body2'>Sign in to continue.</Typography>
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
                                <TextField
                                    fullWidth
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    label="Password"
                                    value={password}
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
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Grid>
                            <Grid size={12}>
                                <Typography variant='body2' color='error'>{errorText}</Typography>
                            </Grid>
                            <Grid size={12}>
                                <Button fullWidth variant='contained' disabled={!validateForm()} type='submit' sx={{ mt: 1 }}>Sign in</Button>
                            </Grid>
                            <Grid size={12}>
                                {isCustomSupabaseConfig() || isSelfHostedConfig() ? (
                                    <Typography variant='body2' color='text.secondary'>
                                        Forgot your password? Contact your administrator.
                                    </Typography>
                                ) : (
                                    <Button size='small' onClick={() => navigate('/forgot-password', { replace: true })}>Forgot password?</Button>
                                )}
                            </Grid>
                            <Grid size={12}>
                                <Typography display='inline' variant='body2'>Don't have an account? </Typography>
                                <Button size='small' onClick={handleRedirectSignIn}>Sign Up</Button>
                            </Grid>
                            <Grid size={12} sx={{ textAlign: 'center' }}>
                                <Button
                                    size='small'
                                    startIcon={<StorageIcon />}
                                    onClick={() => navigate('/backend-config')}
                                >
                                    Configure Backend
                                </Button>
                                {isCustomSupabaseConfig() && (
                                    <Chip label="Custom backend" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />
                                )}
                            </Grid>
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
        </>
    );
}
