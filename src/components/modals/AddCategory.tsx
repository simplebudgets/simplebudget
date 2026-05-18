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
import { dialogPaperStyles, useGlobalStore } from "../../store/globalStore";
import { v4 as uuidv4 } from "uuid";
import { useTableStore } from "../../store/tableStore";
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from "@mui/icons-material/Add";
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import { withNetworkTimeout } from "../../lib/networkUtils";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

export default function AddCategory() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const offline = useIsOffline();
    const addNewCategory = useModalStore(s => s.addCategory);
    const setAddNewCategory = useModalStore(s => s.setAddCategory);
    const [categoryName, setCategoryName] = React.useState('');
    const [categoryAmount, setCategoryAmount] = React.useState(0);
    const setCategoryArray = useTableStore(s => s.setCategories)
    const currentSectionID = useModalStore(s => s.currentSection);
    const sectionsArray = useTableStore(s => s.sections);
    const currentSectionName = sectionsArray.find(x => x.recordID === currentSectionID)?.sectionName
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const [errorText, setErrorText] = React.useState('')
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const verifyInputs = () => {
        if (categoryName === '' || categoryName === null) {
            setErrorText('Please enter a category name')
            return false
        }
        //@ts-ignore
        if (categoryAmount === null || categoryAmount === '') {
            setCategoryAmount(0)
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
                let newCategory = {
                    recordID: uuidv4(),
                    sectionID: currentSectionID,
                    categoryName: categoryName,
                    //@ts-ignore
                    amount: categoryAmount === '' ? 0 : Number(categoryAmount),
                    categoryNote: '',
                };
                let { error } = await withNetworkTimeout(
                    Promise.resolve(supabase.from('categories').insert(newCategory))
                ) as { error: any };
                if (error) {
                    setLoadingOpen(false)
                    setErrorText(error.message)
                    return
                }
                setCategoryArray(prevState => [...prevState, newCategory]);
                setAddNewCategory(false)
                setLoadingOpen(false)
                setSnackSev('success')
                setSnackText('Category Added!')
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
        if (addNewCategory) return;
        setCategoryName('')
        setCategoryAmount(0)
        setErrorText('')
    }, [addNewCategory])
    return (
        <>
            <Dialog open={addNewCategory}
                onClose={() => setAddNewCategory(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Category <IconButton onClick={() => setAddNewCategory(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Typography>Adding to: {currentSectionName}</Typography>
                            <Grid size={12}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    value={categoryName}
                                    onChange={(event: any) => setCategoryName(event.target.value)}
                                    type="text"
                                    label="Category Name"
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    onFocus={handleFocus}
                                    value={categoryAmount}
                                    onChange={(event: any) => setCategoryAmount(event.target.value)}
                                    type="number"
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        },
                                        htmlInput: {
                                            step: 'any',
                                        },
                                    }}
                                    placeholder='Budget Amount'
                                    label="Budget Amount"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<AddIcon />} variant='contained' type='submit' disabled={offline}>Add Category</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    )
}
