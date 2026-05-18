import React from 'react';
import TextField from "@mui/material/TextField";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import { useModalStore } from '../../store/modalStore';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
    dialogPaperStyles,
    useGlobalStore
} from "../../store/globalStore";
import { useTableStore } from "../../store/tableStore";
import SaveIcon from '@mui/icons-material/Save';
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import { withNetworkTimeout } from "../../lib/networkUtils";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from "@mui/material/Stack";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

export default function EditSection() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const offline = useIsOffline();
    const openEditSection = useModalStore(s => s.editSection);
    const setOpenEditSection = useModalStore(s => s.setEditSection);
    const transactionsArray = useTableStore(s => s.transactions)
    const setTransactionsArray = useTableStore(s => s.setTransactions)
    const categoryArray = useTableStore(s => s.categories)
    const setCategoryArray = useTableStore(s => s.setCategories)
    const sectionsArray = useTableStore(s => s.sections);
    const setSectionsArray = useTableStore(s => s.setSections);
    const currentSectionID = useModalStore(s => s.currentSection);
    let currentSectionDetails = sectionsArray.find(x => x.recordID === currentSectionID)
    const [sectionName, setSectionName] = React.useState('');
    const [sectionType, setSectionType] = React.useState('expense');
    const handleTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: string,
    ) => {
        if (newType !== null) {
            setSectionType(newType);
        }
    };
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const areYouSureOpen = useModalStore(s => s.areYouSure);
    const setAreYouSureOpen = useModalStore(s => s.setAreYouSure);
    const setCheckTitle = useGlobalStore(s => s.setAreYouSureTitle);
    const setCheckDetails = useGlobalStore(s => s.setAreYouSureDetails);
    const checkAccept = useGlobalStore(s => s.areYouSureAccept);
    const setCheckAccept = useGlobalStore(s => s.setAreYouSureAccept);
    const [errorText, setErrorText] = React.useState('')
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [deleteSection, setDeleteSection] = React.useState(false)
    const moreOpen = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    async function handleDoubleCheck() {
        setDeleteSection(true)
        setAnchorEl(null);
        setCheckTitle('Are you sure you want to delete this section?')
        setCheckDetails('WARNING: This will delete all categories and transactions assigned to this section as well.')
        setAreYouSureOpen(true)
    }

    React.useEffect(() => {
        if (!areYouSureOpen) {
            if (checkAccept) {
                handleDelete()
            }
            setDeleteSection(false)
        }
    }, [areYouSureOpen])

    async function deleteTransactions(catArray: string | any[]) {
        for (let i = 0; i < catArray.length; i++) {
            let { error } = await supabase
                .from('transactions')
                .delete()
                .eq('categoryID', catArray[i].recordID)
            let newTrans = transactionsArray.filter(function (el) { return el.categoryID !== catArray[i].recordID; });
            setTransactionsArray(newTrans)
        }
    }

    async function handleDelete() {
        setErrorText('')
        if (!deleteSection) {
            return
        }
        setLoadingOpen(true)
        try {
            await withNetworkTimeout(ensureSession());
            let catDelete = categoryArray.filter(x => x.sectionID === currentSectionID)
            await deleteTransactions(catDelete)

            await withNetworkTimeout(
                Promise.resolve(supabase.from('categories').delete().eq('sectionID', currentSectionID))
            );

            let { error } = await withNetworkTimeout(
                Promise.resolve(supabase.from('sections').delete().eq('recordID', currentSectionID))
            ) as { error: any };
            if (error) {
                setLoadingOpen(false)
                setErrorText(error.message)
                return
            }
            let newSec = sectionsArray.filter(function (el) { return el.recordID !== currentSectionID; });
            let newCat = categoryArray.filter(function (el) { return el.sectionID !== currentSectionID; });
            setSectionsArray(newSec)
            setCategoryArray(newCat)

            setOpenEditSection(false)
            setLoadingOpen(false)
            setSnackSev('success')
            setSnackText('Section deleted')
            setSnackOpen(true)
            setCheckAccept(false)
            setDeleteSection(false)
        } catch (err: any) {
            setLoadingOpen(false)
            setErrorText(err.message || 'Network error — try again when online')
        }
    }
    const verifyInputs = () => {
        if (sectionName === '' || sectionName === null) {
            setErrorText('Please enter section name.')
            return false
        }
        return true
    }
    async function handleSubmit(event: any) {
        event.preventDefault();
        setErrorText('')
        if (verifyInputs()) {
            setLoadingOpen(true)
            try {
                await withNetworkTimeout(ensureSession());
                let { error } = await withNetworkTimeout(
                    Promise.resolve(supabase.from('sections').update({
                        sectionName: sectionName,
                        sectionType: sectionType,
                    }).eq('recordID', currentSectionID))
                ) as { error: any };
                if (error) {
                    setLoadingOpen(false)
                    setErrorText(error.message)
                    return
                }
                let newArr = sectionsArray.map(obj => {
                    if (obj.recordID === currentSectionID) {
                        return {
                            ...obj,
                            sectionName: sectionName,
                            sectionType: sectionType
                        }
                    }
                    return obj;
                });
                setLoadingOpen(false)
                setSectionsArray(newArr);
                setOpenEditSection(false)
                setSnackSev('success')
                setSnackText('Section updated!')
                setSnackOpen(true)
            } catch (err: any) {
                setLoadingOpen(false)
                setErrorText(err.message || 'Network error — try again when online')
            }
        }
    }
    const handleFocus = (event: any) => {
        if (event) {
            event.target.select()
        }
    };
    React.useEffect(() => {
        if (!openEditSection) return;
        if (currentSectionDetails) {
            setSectionName(currentSectionDetails.sectionName)
            setSectionType(currentSectionDetails.sectionType)
        }
        setErrorText('')
    }, [openEditSection])
    return (
        <>
            <Dialog open={openEditSection}
                onClose={() => setOpenEditSection(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction='row' alignItems='center' spacing={1}>
                            <IconButton
                                size='small'
                                aria-label="more"
                                aria-controls={moreOpen ? 'long-menu' : undefined}
                                aria-expanded={moreOpen ? 'true' : undefined}
                                aria-haspopup="true"
                                onClick={handleClick}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <div>Edit Section</div>
                        </Stack>
                        <IconButton onClick={() => setOpenEditSection(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Grid size={12}>
                                <ToggleButtonGroup
                                    color={sectionType === 'income' ? 'success' : 'warning'}
                                    value={sectionType}
                                    fullWidth
                                    exclusive
                                    onChange={handleTypeChange}
                                >
                                    <ToggleButton value="income"><TrendingUpIcon sx={{ mr: 0.5 }} />Income</ToggleButton>
                                    <ToggleButton value="expense"><TrendingDownIcon sx={{ mr: 0.5 }} />Expense</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    onFocus={handleFocus}
                                    value={sectionName}
                                    onChange={(event: any) => setSectionName(event.target.value)}
                                    type="text"
                                    label="Section Name"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<SaveIcon />} variant='contained' type='submit' disabled={offline}>Save Changes</Button>
                    </DialogActions>
                </Box>
            </Dialog>
            <Menu
                id="long-menu"
                slotProps={{
                    list: {
                        'aria-labelledby': 'long-button',
                    },
                }}
                anchorEl={anchorEl}
                open={moreOpen}
                onClose={handleClose}
            >
                <MenuItem onClick={handleDoubleCheck} disabled={offline}>
                    <DeleteIcon />
                    Delete
                </MenuItem>
            </Menu>
        </>
    )
}
