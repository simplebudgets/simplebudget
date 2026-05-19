import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { Switch } from "@mui/material";
import { useGlobalStore, dialogPaperStyles } from "../store/globalStore";
import { useTableStore } from "../store/tableStore";
import { useModalStore } from "../store/modalStore";
import { supaALLsections, supaCategories } from './extras/api_functions'
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from "@mui/material/Divider";
import Typography from '@mui/material/Typography';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ListItemIcon from '@mui/material/ListItemIcon';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShareIcon from '@mui/icons-material/Share';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import { supabase } from "../lib/supabase";
import DeleteIcon from '@mui/icons-material/Delete';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ShareBudget from "./modals/ShareBudget";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { QRCodeSVG } from 'qrcode.react';
import ChangePassword from './modals/ChangePassword'
import ExportToCSV from './modals/ExportToCSV'
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useIsOffline } from "./extras/OfflineAlert";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import DialogActions from '@mui/material/DialogActions';

export default function SettingsPage() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const setExportToCSV = useModalStore(s => s.setExportToCSV)
    const offline = useIsOffline();
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const sectionsArray = useTableStore(s => s.sections);
    const [slideCheck, setSlideCheck] = React.useState(false);
    const areYouSureOpen = useModalStore(s => s.areYouSure);
    const setAreYouSureOpen = useModalStore(s => s.setAreYouSure);
    const setCheckTitle = useGlobalStore(s => s.setAreYouSureTitle);
    const setCheckDetails = useGlobalStore(s => s.setAreYouSureDetails);
    const checkAccept = useGlobalStore(s => s.areYouSureAccept);
    const setCheckAccept = useGlobalStore(s => s.setAreYouSureAccept);
    const [budgetDelete, setBudgetDelete] = React.useState(false)
    const setShareBudgetOpen = useModalStore(s => s.setShareBudget)
    const currentTheme = useGlobalStore(s => s.themeAtom);
    const setTheme = useGlobalStore(s => s.setThemeAtom);
    const setOpenChangePassword = useModalStore(s => s.setOpenChangePassword);
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
    const currentUserDetails = useGlobalStore(s => s.currentUser)
    const budgetsArray = useTableStore(s => s.budgets)
    const setSelectBudgetOpen = useModalStore(s => s.setSelectBudget)
    let currentBudgetDetails = budgetsArray.find(x => x.recordID === currentBudget.budgetID)
    const [qrOpen, setQrOpen] = React.useState(false)
    const handleThemeClick = (event: any) => {
        setSlideCheck(event.target.checked);
        if (event.target.checked) {
            setTheme('dark');
            localStorage.setItem('userTheme', 'dark')
            setSnackSev('success')
            setSnackText('Dark mode activated!')
            setSnackOpen(true)
        } else {
            setTheme('light');
            localStorage.setItem('userTheme', 'light')
            setSnackSev('success')
            setSnackText('Set to light mode.')
            setSnackOpen(true)
        }
    };
    const handleListThemeClick = () => {
        if (!slideCheck) {
            setTheme('dark');
            localStorage.setItem('userTheme', 'dark')
            setSnackSev('success')
            setSnackText('Dark mode activated!')
            setSnackOpen(true)
        } else {
            setTheme('light');
            localStorage.setItem('userTheme', 'light')
            setSnackSev('success')
            setSnackText('Set to light mode.')
            setSnackOpen(true)
        }
        setSlideCheck(!slideCheck);
    };
    async function supaLogOut() {
        let { error } = await supabase.auth.signOut()
    }
    React.useEffect(() => {
        if (!areYouSureOpen) {
            if (checkAccept) {
                handleDelete()
            }
            setBudgetDelete(false)
        }
    }, [areYouSureOpen])
    async function handleDoubleCheck() {
        setBudgetDelete(true)
        setCheckTitle('Are you sure you want to delete this budget?')
        setCheckDetails('WARNING: This will delete all sections, categories, and transactions assigned to this budget. THIS CANNOT BE UNDONE')
        setAreYouSureOpen(true)
    }
    async function handleDelete() {
        if (!budgetDelete) {
            return
        }
        setLoadingOpen(true)
        await supabase
            .from('transactions')
            .delete()
            .eq('budgetID', currentBudget.budgetID)

        let allSections = await supaALLsections(currentBudget.budgetID)

        await supabase
            .from('categories')
            .delete()
            //@ts-ignore
            .in('sectionID', allSections?.map(x => x.recordID))

        let { data } = await supabase
            .from('sections')
            .delete()
            .eq('budgetID', currentBudget.budgetID)

        await supabase
            .from('shared')
            .delete()
            .eq('budgetID', currentBudget.budgetID)

        let { error } = await supabase
            .from('budgets')
            .delete()
            .eq('recordID', currentBudget.budgetID)

        if (error) {
            console.log(error)
            setLoadingOpen(false)
            setSnackSev('error')
            setSnackText('Something went wrong')
            setSnackOpen(true)
            return
        }
        //window.location.reload();
        setLoadingOpen(false)
        setSnackSev('success')
        setSnackText('Budget deleted')
        setSnackOpen(true)
        setCheckAccept(false)
        setBudgetDelete(false)
    }
    React.useEffect(() => {
        if (currentTheme === 'dark') {
            setSlideCheck(true)
        } else {
            setSlideCheck(false)
        }
    }, [slideCheck, currentTheme]);
    const navigate = useNavigate();
    const fnLogout = () => {
        supaLogOut()
        navigate("/login", { replace: true });
    }
    const copyUserID = async () => {
        //navigator.clipboard.writeText(user.recordID)
        await navigator.clipboard
            .writeText(currentUserDetails.recordID)
            .then(() => {
                setSnackSev('success')
                setSnackText('User ID copied')
                setSnackOpen(true)
            })
            .catch(() => {
                setSnackSev('error')
                setSnackText('Something went wrong')
                setSnackOpen(true)
            });
    }
    React.useEffect(() => {
        window.scrollTo(0, 0)
    }, [])
    return (
        <>
            <Box display='flex' flexDirection='column' alignItems='center'>
                <Stack spacing={2} alignItems="stretch" sx={{ maxWidth: 400, width: '100%' }}>
                    <Typography sx={{ alignSelf: 'flex-start' }} color='text.secondary' variant='h6'>Settings</Typography>
                    <Paper elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                        <List>
                            <ListItem disablePadding>
                                <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '600', ml: 1 }}>General</Typography>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={handleListThemeClick}>
                                    <ListItemIcon>
                                        <DarkModeIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Dark Mode" />
                                    <Switch sx={{ ml: 1 }} size='small' checked={slideCheck} onChange={handleThemeClick} />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Paper>
                    <Paper elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                        <List>
                            <ListItem disablePadding>
                                <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '600', ml: 1 }}>{'Budget: ' + currentBudgetDetails?.budgetName}</Typography>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setSelectBudgetOpen(true)}>
                                    <ListItemIcon>
                                        <ListAltIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Switch Budgets" />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setExportToCSV(true)} disabled={offline}>
                                    <ListItemIcon>
                                        <FileDownloadIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Export Data to CSV" />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setShareBudgetOpen(true)} disabled={offline}>
                                    <ListItemIcon>
                                        <ShareIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Share Budget" />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={handleDoubleCheck} disabled={offline}>
                                    <ListItemIcon>
                                        <DeleteIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Delete Budget" />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Paper>
                    <Paper elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                        <List>
                            <ListItem disablePadding>
                                <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '600', ml: 1 }}>Account: {currentUserDetails.fullName}</Typography>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setQrOpen(true)}>
                                    <ListItemIcon>
                                        <QrCodeIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Show My QR Code" secondary="For sharing budgets" />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setOpenChangePassword(true)} disabled={offline}>
                                    <ListItemIcon>
                                        <LockResetIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Change Password" />
                                </ListItemButton>
                            </ListItem>
                            <Divider />
                            <ListItem disablePadding>
                                <ListItemButton onClick={fnLogout} disabled={offline}>
                                    <ListItemIcon>
                                        <LogoutIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="Logout" />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Paper>
                </Stack>
            </Box>
            <ShareBudget />
            <ChangePassword />
            <ExportToCSV />
            <Dialog
                open={qrOpen}
                onClose={() => setQrOpen(false)}
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={() => { copyUserID(); setQrOpen(false); }}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        My User ID<IconButton onClick={() => setQrOpen(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center', pb: 3 }} dividers>
                        <QRCodeSVG value={currentUserDetails.recordID} size={200} />
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 2, wordBreak: 'break-all' }}>
                            {currentUserDetails.recordID}
                        </Typography>
                        <DialogActions>
                            <Button
                                sx={{ mt: 1 }}
                                fullWidth
                                variant='contained'
                                type='submit'
                                startIcon={<ContentCopyIcon />}
                            >
                                Copy to Clipboard
                            </Button>
                        </DialogActions>
                    </DialogContent>
                </Box>
            </Dialog>
        </>
    )
}
