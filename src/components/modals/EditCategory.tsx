import React from 'react';
import TextField from "@mui/material/TextField";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import BalanceIcon from '@mui/icons-material/Balance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useModalStore } from '../../store/modalStore';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { dialogPaperStyles, useGlobalStore } from "../../store/globalStore";
import { useTableStore } from "../../store/tableStore";
import InputAdornment from '@mui/material/InputAdornment';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DeleteIcon from '@mui/icons-material/Delete';
import Stack from "@mui/material/Stack";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import EditIcon from '@mui/icons-material/Edit';
import Grow from '@mui/material/Grow';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemButton from "@mui/material/ListItemButton";
import Avatar from "@mui/material/Avatar";
import dayjs from "dayjs";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import Fab from "@mui/material/Fab";
import GlobalJS from "../extras/GlobalJS";
import LinearProgress from '@mui/material/LinearProgress';
import useCategoryActions from "../extras/useCategoryActions";
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});
const fabStyle = { position: 'fixed', bottom: 16, right: 16 };

export default function EditCategory() {
    const openEditCategory = useModalStore(s => s.editCategory);
    const setOpenEditCategory = useModalStore(s => s.setEditCategory);
    const offline = useIsOffline();
    const [categoryName, setCategoryName] = React.useState('');
    const [categoryAmount, setCategoryAmount] = React.useState(0);
    const [categoryNote, setCategoryNote] = React.useState('');
    const [editMode, setEditMode] = React.useState(false);
    const transactionsArray = useTableStore(s => s.transactions);
    const currentCategoryID = useModalStore(s => s.currentCategory);
    const categoryArray = useTableStore(s => s.categories);
    const currentCategoryDetails = categoryArray.find(x => x.recordID === currentCategoryID);
    const [errorText, setErrorText] = React.useState('');
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const moreOpen = Boolean(anchorEl);
    const [categoryDelete, setCategoryDelete] = React.useState(false);
    const [categorySum, setCategorySum] = React.useState(0);
    const { grabCategorySum } = GlobalJS();

    const {
        balanceCategory,
        allocateRestOfBudget,
        promptDeleteCategory,
        deleteCategory,
        updateCategory,
        currentSection,
        currentSectionType,
    } = useCategoryActions();

    const setTransactionCategory = useGlobalStore(s => s.setAddTransactionCategory);
    const setAddNewTransaction = useModalStore(s => s.setAddTransaction);
    const setTransactionType = useGlobalStore(s => s.setAddTransactionType);
    const setCurrentTransaction = useModalStore(s => s.setCurrentTransaction);
    const setOpenEditTransaction = useModalStore(s => s.setEditTransaction);
    const areYouSureOpen = useModalStore(s => s.areYouSure);
    const checkAccept = useGlobalStore(s => s.areYouSureAccept);
    const setCheckAccept = useGlobalStore(s => s.setAreYouSureAccept);

    let catAllowedTotal = categoryAmount;
    let incomeType = 1;
    if (currentSectionType === 'income') {
        catAllowedTotal = categoryAmount * -1;
        incomeType = -1;
    }

    const addNewTransClick = () => {
        setTransactionCategory({
            sectionName: currentSection?.sectionName,
            id: currentCategoryID,
            label: currentCategoryDetails?.categoryName,
        });
        setTransactionType(currentSectionType);
        setAddNewTransaction(true);
    };

    const openTransaction = (trsID: string) => {
        setCurrentTransaction(trsID);
        setOpenEditTransaction(true);
    };

    // Menu actions
    async function handleBalanceClick() {
        setAnchorEl(null);
        const err = await balanceCategory();
        if (err) { setErrorText(err); return; }
        setOpenEditCategory(false);
    }
    async function handleAllocateClick() {
        setAnchorEl(null);
        const err = await allocateRestOfBudget();
        if (err) { setErrorText(err); return; }
        // Refresh local state
        const updated = useTableStore.getState().categories.find(c => c.recordID === currentCategoryID);
        if (updated) setCategoryAmount(updated.amount);
    }
    function handleDeleteClick() {
        setCategoryDelete(true);
        setAnchorEl(null);
        promptDeleteCategory();
    }

    React.useEffect(() => {
        if (!areYouSureOpen && categoryDelete) {
            if (checkAccept) {
                deleteCategory();
                setOpenEditCategory(false);
                setCheckAccept(false);
            }
            setCategoryDelete(false);
        }
    }, [areYouSureOpen]);

    async function handleSubmit(event: any) {
        event.preventDefault();
        setErrorText('');
        if (categoryName === '' || categoryName === null) {
            setErrorText('Please enter a category name');
            return;
        }
        const amt = (categoryAmount === null || (categoryAmount as any) === '') ? 0 : Number(categoryAmount);
        const err = await updateCategory(categoryName, amt, categoryNote);
        if (err) { setErrorText(err); return; }
        setOpenEditCategory(false);
    }

    const handleFocus = (event: any) => { if (event) event.target.select(); };

    React.useEffect(() => {
        if (!openEditCategory) return;
        if (currentCategoryDetails) {
            setCategoryName(currentCategoryDetails.categoryName);
            setCategoryAmount(currentCategoryDetails.amount);
            setCategoryNote(currentCategoryDetails.categoryNote || '');
            setEditMode(false);
            setCategorySum(grabCategorySum(currentCategoryID));
        }
        setErrorText('');
    }, [openEditCategory]);

    React.useEffect(() => {
        if (!openEditCategory) return;
        if (currentCategoryDetails) {
            setCategorySum(grabCategorySum(currentCategoryID));
        }
    }, [transactionsArray]);

    return (
        <>
            <Dialog open={openEditCategory}
                onClose={() => setOpenEditCategory(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', overflow: 'auto', minHeight: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction='row' alignItems='center' spacing={1}>
                            <IconButton size='small' onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <MoreVertIcon />
                            </IconButton>
                            <Stack spacing={-1}>
                                <Typography variant='overline'>
                                    {currentSection?.sectionName}
                                    {currentSectionType === 'income' ? ' · Income' : ' · Expense'}
                                </Typography>
                                {editMode ?
                                    <Grow in={editMode}>
                                        <TextField fullWidth size='small' variant='filled' onFocus={handleFocus}
                                            value={categoryName} onChange={(e: any) => setCategoryName(e.target.value)}
                                            type="text" label="Category Name" />
                                    </Grow>
                                    : <Typography variant='h6'>{categoryName}</Typography>
                                }
                            </Stack>
                        </Stack>
                        <IconButton onClick={() => setOpenEditCategory(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={1}>
                            <Grid size={12}>
                                {editMode ?
                                    <TextField fullWidth sx={{ mb: 1 }} onFocus={handleFocus}
                                        value={categoryAmount} onChange={(e: any) => setCategoryAmount(e.target.value)}
                                        type="number"
                                        slotProps={{
                                            input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                                            htmlInput: { step: 'any' },
                                        }}
                                        placeholder='Budget Amount' label="Budget Amount" />
                                    : null}
                                <Stack direction='row' justifyContent='space-between'>
                                    <Paper elevation={1} sx={{ borderRadius: 3 }}>
                                        <Box display='flex' alignItems='center' justifyContent='space-evenly' sx={{ width: '100%', p: 1, textAlign: 'center' }}>
                                            <Paper elevation={3} sx={{ px: 1 }}>
                                                <Typography color='text.secondary' variant='body1'>Budgeted: {formatter.format(catAllowedTotal * incomeType)}</Typography>
                                            </Paper>
                                            <Paper elevation={3} sx={{ mx: 1, px: 1 }}>
                                                <Typography color='text.secondary' variant='body1'>Tracked: {formatter.format(categorySum)}</Typography>
                                            </Paper>
                                            <Paper elevation={3} sx={{ px: 1 }}>
                                                <Typography
                                                    color={(catAllowedTotal + categorySum) * incomeType < 0 ? 'error.main' : 'success.main'}
                                                    style={{ fontWeight: 'bold' }} variant='body1'>
                                                    Remaining: {formatter.format((catAllowedTotal + categorySum) * incomeType)}
                                                </Typography>
                                            </Paper>
                                        </Box>
                                        <LinearProgress sx={{ height: 10, borderBottomRightRadius: 6, borderBottomLeftRadius: 6 }}
                                            variant="determinate" color={((-1 * categorySum) / categoryAmount) > 1 ? 'error' : 'success'}
                                            value={((-1 * categorySum * incomeType) / categoryAmount) * 100} />
                                    </Paper>
                                    {bigger ?
                                        <Fab color="secondary" variant='extended' onClick={addNewTransClick}>
                                            <AddIcon /> Add Transaction
                                        </Fab> : null}
                                </Stack>
                            </Grid>
                            <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    value={categoryNote}
                                    onChange={(e: any) => setCategoryNote(e.target.value)}
                                    onBlur={async () => {
                                        if (categoryNote !== (currentCategoryDetails?.categoryNote || '')) {
                                            await updateCategory(
                                                currentCategoryDetails?.categoryName ?? categoryName,
                                                currentCategoryDetails?.amount ?? categoryAmount,
                                                categoryNote
                                            );
                                        }
                                    }}
                                    label="Notes"
                                    placeholder="Add notes for this category..."
                                    sx={{ mb: 1 }}
                                    disabled={offline}
                                />
                            </Grid>
                            {editMode ?
                                <Grid size={12}>
                                    <Grow in={editMode}>
                                        <DialogActions>
                                            <Button fullWidth startIcon={<SaveIcon />} variant='contained' type='submit' disabled={offline}>Save Changes</Button>
                                        </DialogActions>
                                    </Grow>
                                </Grid> : null}
                            <Grid size={12} container>
                                <Paper elevation={5} sx={{ width: '100%', borderRadius: 3 }}>
                                    <List dense>
                                        {transactionsArray.filter(x => x.categoryID === currentCategoryDetails?.recordID).length > 0 ?
                                            <>
                                                <ListItem disablePadding key="1">
                                                    <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '600', ml: 1 }}>Tracked</Typography>
                                                </ListItem>
                                                {transactionsArray.filter(x => x.categoryID === currentCategoryDetails?.recordID).sort(
                                                    (a, b) => b.transactionDate - a.transactionDate
                                                ).map((row) => (
                                                    <React.Fragment key={row.recordID}>
                                                        <Divider />
                                                        <ListItem disablePadding>
                                                            <ListItemButton onClick={() => openTransaction(row.recordID)}>
                                                                <Grid container columnSpacing={1} alignItems='center' sx={{ width: '100%' }}>
                                                                    <Grid size={1.3}>
                                                                        <Avatar sx={{ ml: -1, fontSize: 15, textAlign: 'center', bgcolor: 'primary.light' }}>
                                                                            {dayjs(row.transactionDate).format('MMM DD')}
                                                                        </Avatar>
                                                                    </Grid>
                                                                    <Grid size='grow'>
                                                                        <Typography sx={{ mt: 0.5 }} variant='body1'>{row.title}</Typography>
                                                                    </Grid>
                                                                    <Grid size="auto" sx={{ textAlign: 'right' }}>
                                                                        <Typography variant='body1'>
                                                                            {(row.transactionType === 'expense' ? '-' : '+') + formatter.format(row.amount)}
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </ListItemButton>
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </>
                                            :
                                            <ListItem disablePadding key="2">
                                                <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '600', ml: 1 }}>Nothing Tracked Here</Typography>
                                            </ListItem>
                                        }
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    {bigger ? null :
                        <Fab color="secondary" sx={fabStyle} onClick={addNewTransClick}><AddIcon /></Fab>}
                </Box>
            </Dialog>
            <Menu anchorEl={anchorEl} open={moreOpen} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); setEditMode(!editMode); }}>
                    <EditIcon sx={{ mr: 1 }} />Edit Category
                </MenuItem>
                <MenuItem onClick={handleBalanceClick} disabled={offline}>
                    <BalanceIcon sx={{ mr: 1 }} />Balance Category
                </MenuItem>
                <MenuItem onClick={handleAllocateClick} disabled={offline}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} />Allocate Rest of Budget
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} disabled={offline}>
                    <DeleteIcon sx={{ mr: 1 }} />Delete Category
                </MenuItem>
            </Menu>
        </>
    );
}
