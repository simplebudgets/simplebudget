import React from 'react';
import Typography from '@mui/material/Typography';
import Stack from "@mui/material/Stack";
import BudgetSection from "./subcomponents/BudgetSection";
import Button from '@mui/material/Button';
import { useModalStore } from "../store/modalStore";
import { useTableStore } from "../store/tableStore";
import { useGlobalStore } from "../store/globalStore";
import AddSection from "./modals/AddSection";
import Box from '@mui/material/Box';
import AddCategory from "./modals/AddCategory";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import dayjs from "dayjs";
import PostAddIcon from '@mui/icons-material/PostAdd';
import EditCategory from "./modals/EditCategory";
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Paper from "@mui/material/Paper";
import useGrabBudgetData from "./extras/GrabBudgetData";
import EditSection from "./modals/EditSection";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CopyBudget from "./modals/CopyBudget";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import useCategoryActions from "./extras/useCategoryActions";
import BalanceIcon from '@mui/icons-material/Balance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SaveIcon from '@mui/icons-material/Save';
import { useIsOffline } from "./extras/OfflineAlert";

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function BudgetPage() {
    const setAddNewSection = useModalStore(s => s.setAddSection)
    const sectionsArray = useTableStore(s => s.sections)
    const transactionsArray = useTableStore(s => s.transactions)
    const setOpenCopyBudget = useModalStore(s => s.setCopyBudget)
    const { balanceCategory, allocateRestOfBudget, promptDeleteCategory, deleteCategory, updateCategory } = useCategoryActions();
    const offline = useIsOffline();
    const [sidebarAnchorEl, setSidebarAnchorEl] = React.useState<null | HTMLElement>(null);
    const sidebarMenuOpen = Boolean(sidebarAnchorEl);
    const [sidebarEditMode, setSidebarEditMode] = React.useState(false);
    const [sidebarEditName, setSidebarEditName] = React.useState('');
    const [sidebarEditAmount, setSidebarEditAmount] = React.useState(0);
    const [sidebarNote, setSidebarNote] = React.useState('');
    const [pendingDelete, setPendingDelete] = React.useState(false);
    const [overBudgetExpanded, setOverBudgetExpanded] = React.useState(false);
    const areYouSureOpen = useModalStore(s => s.areYouSure);
    const checkAccept = useGlobalStore(s => s.areYouSureAccept);
    const setCheckAccept = useGlobalStore(s => s.setAreYouSureAccept);
    const { grabBudgetData } = useGrabBudgetData();
    const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
    const setCurrentBudget = useTableStore(s => s.setCurrentBudgetAndMonth)
    const [anchorEl1, setAnchorEl1] = React.useState<null | HTMLElement>(null);
    const categoryArray = useTableStore(s => s.categories)
    const moreOpen = Boolean(anchorEl1);
    const selectedMonth = dayjs(`${currentBudget.year}-${currentBudget.month}-01`, 'YYYY-MMMM-DD');
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const selectedCategoryID = useModalStore(s => s.currentCategory);
    const selectedSectionID = useModalStore(s => s.currentSection);
    const setCurrentTransaction = useModalStore(s => s.setCurrentTransaction);
    const setOpenEditTransaction = useModalStore(s => s.setEditTransaction);

    // Desktop sidebar: selected category details
    const selectedCategory = categoryArray.find(c => c.recordID === selectedCategoryID);
    const selectedSection = sectionsArray.find(s => s.recordID === selectedSectionID);
    const sidebarTransactions = transactionsArray
        .filter(t => t.categoryID === selectedCategoryID)
        .sort((a, b) => b.transactionDate - a.transactionDate);
    const sidebarSpent = sidebarTransactions
        .filter(t => t.transactionType === 'expense')
        .reduce((a, t) => a + t.amount, 0);
    const sidebarEarned = sidebarTransactions
        .filter(t => t.transactionType === 'income')
        .reduce((a, t) => a + t.amount, 0);
    const sidebarTracked = Math.round((sidebarEarned - sidebarSpent) * 100) / 100;
    const sidebarRemaining = selectedCategory ? selectedCategory.amount + sidebarTracked : 0;

    const handleMonthChange = (newValue: any) => {
        if (!newValue) return;
        const year = Number(newValue.format('YYYY'));
        const month = newValue.format('MMMM');
        setCurrentBudget({
            budgetID: currentBudget.budgetID,
            year,
            month,
        });
        localStorage.setItem('currentBudget', JSON.stringify({
            budgetID: currentBudget.budgetID,
            year,
            month,
        }));
        grabBudgetData(currentBudget.budgetID, year, month);
    };
    let totalIncomeStart = categoryArray.reduce((accumulator, object) => {
        let section = sectionsArray.find(x => x.recordID === object.sectionID)
        if (section?.sectionType === 'income') {
            return accumulator + object.amount;
        }
        return accumulator
    }, 0)
    let totalExpensesStart = categoryArray.reduce((accumulator, object) => {
        let section = sectionsArray.find(x => x.recordID === object.sectionID)
        if (section?.sectionType === 'expense') {
            return accumulator + object.amount;
        }
        return accumulator
    }, 0)
    let totalActualExpensesStart = transactionsArray.reduce((accumulator, object) => {
        if (object.transactionType === "expense") {
            return accumulator + object.amount;
        } else {
            return accumulator
        }
    }, 0)
    let totalActualIncomeStart = transactionsArray.reduce((accumulator, object) => {
        if (object.transactionType === "income") {
            return accumulator + object.amount;
        } else {
            return accumulator
        }
    }, 0)

    const [totalIncome, setTotalIncome] = React.useState(totalIncomeStart)
    const [totalExpenses, setTotalExpenses] = React.useState(totalExpensesStart)
    const [totalActualExpenses, setTotalActualExpenses] = React.useState(totalActualExpensesStart)
    const [totalActualIncome, setTotalActualIncome] = React.useState(totalActualIncomeStart)
    React.useEffect(() => {
        setTotalIncome(
            categoryArray.reduce((accumulator, object) => {
                let section = sectionsArray.find(x => x.recordID === object.sectionID)
                if (section?.sectionType === 'income') {
                    return accumulator + object.amount;
                }
                return accumulator
            }, 0)
        )
        setTotalExpenses(
            categoryArray.reduce((accumulator, object) => {
                let section = sectionsArray.find(x => x.recordID === object.sectionID)
                if (section?.sectionType === 'expense') {
                    return accumulator + object.amount;
                }
                return accumulator
            }, 0)
        )
        setTotalActualExpenses(
            transactionsArray.reduce((accumulator, object) => {
                if (object.transactionType === "expense") {
                    return accumulator + object.amount;
                } else {
                    return accumulator
                }
            }, 0)
        )
        setTotalActualIncome(
            transactionsArray.reduce((accumulator, object) => {
                if (object.transactionType === "income") {
                    return accumulator + object.amount;
                } else {
                    return accumulator
                }
            }, 0)
        )
    }, [categoryArray, sectionsArray, transactionsArray])
    const handleOpenOptions = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl1(event.currentTarget);
    };
    const closeOptions = () => {
        setAnchorEl1(null);
    };
    function copyBudgetClick() {
        setAnchorEl1(null);
        setOpenCopyBudget(true)
    }
    React.useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    // Handle sidebar delete confirmation
    React.useEffect(() => {
        if (!areYouSureOpen && pendingDelete) {
            if (checkAccept) {
                deleteCategory();
                setCheckAccept(false);
            }
            setPendingDelete(false);
        }
    }, [areYouSureOpen]);

    // Reset sidebar edit mode when category changes
    React.useEffect(() => {
        setSidebarEditMode(false);
        if (selectedCategory) {
            setSidebarEditName(selectedCategory.categoryName);
            setSidebarEditAmount(selectedCategory.amount);
            setSidebarNote(selectedCategory.categoryNote || '');
        }
    }, [selectedCategoryID, selectedCategory?.categoryName, selectedCategory?.amount, selectedCategory?.categoryNote]);

    function sumCat(idVal: string) {
        return categoryArray.filter(x => x.sectionID === idVal).reduce((accumulator, object) => {
            return accumulator + object.amount;
        }, 0)
    }

    // Compute over-budget expense categories
    const overBudgetCategories = categoryArray.filter(cat => {
        const section = sectionsArray.find(s => s.recordID === cat.sectionID);
        if (section?.sectionType !== 'expense') return false;
        if (cat.amount <= 0) return false;
        const expenses = transactionsArray
            .filter(t => t.categoryID === cat.recordID && t.transactionType === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
        const incomes = transactionsArray
            .filter(t => t.categoryID === cat.recordID && t.transactionType === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const netSpent = expenses - incomes;
        return netSpent > cat.amount + 0.01 && netSpent > 0;
    });
    const overBudgetTotal = overBudgetCategories.reduce((acc, cat) => {
        const expenses = transactionsArray
            .filter(t => t.categoryID === cat.recordID && t.transactionType === 'expense')
            .reduce((a, t) => a + t.amount, 0);
        const incomes = transactionsArray
            .filter(t => t.categoryID === cat.recordID && t.transactionType === 'income')
            .reduce((a, t) => a + t.amount, 0);
        const netSpent = expenses - incomes;
        return acc + (netSpent - cat.amount);
    }, 0);

    return (
        <>
            <Box display='flex' justifyContent='center' gap={3}>
                <Box display='flex' flexDirection='column' alignItems='center' sx={{ flex: '0 1 400px', width: '100%' }}>
                    <Stack spacing={2} alignItems="stretch" sx={{ width: '100%' }}>
                        <Box>
                            <Box sx={{ mt: -0.5 }} display='flex' flexDirection='row' alignSelf='flex-start' alignItems='center'>
                                <IconButton
                                    size='small'
                                    aria-label="more"
                                    aria-controls={moreOpen ? 'long-menu' : undefined}
                                    aria-expanded={moreOpen ? 'true' : undefined}
                                    aria-haspopup="true"
                                    onClick={handleOpenOptions}
                                ><MoreVertIcon /></IconButton>
                                <IconButton size='small' onClick={() => handleMonthChange(selectedMonth.subtract(1, 'month'))}>
                                    <ChevronLeftIcon />
                                </IconButton>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        value={selectedMonth}
                                        onChange={handleMonthChange}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                variant: 'outlined',
                                            },
                                        }}
                                    />
                                </LocalizationProvider>
                                <IconButton size='small' onClick={() => handleMonthChange(selectedMonth.add(1, 'month'))}>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Box>
                            <Paper elevation={2} sx={{ borderRadius: 3, mt: 1, p: 1.5 }}>
                                <Box display='flex' justifyContent='space-between' sx={{ mb: 0.5 }}>
                                    <Typography variant='caption' color='text.secondary'>Planned Total</Typography>
                                    <Typography variant='caption' color='text.secondary'>Tracked Total</Typography>
                                </Box>
                                <Box display='flex' justifyContent='space-between' alignItems='baseline'>
                                    <Typography variant='body2' color='text.secondary'>
                                        {formatter.format(totalIncome)} in
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {formatter.format(totalActualIncome)} in
                                    </Typography>
                                </Box>
                                <Box display='flex' justifyContent='space-between' alignItems='baseline'>
                                    <Typography variant='body2' color='text.secondary'>
                                        {formatter.format(totalExpenses)} out
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {formatter.format(totalActualExpenses)} out
                                    </Typography>
                                </Box>
                                <Box display='flex' justifyContent='space-between' alignItems='baseline' sx={{ mt: 0.5 }}>
                                    <Typography
                                        variant='body1'
                                        sx={{ fontWeight: 'bold' }}
                                        color={totalIncome - totalExpenses < 0 ? 'error.main' : 'success.main'}
                                    >
                                        {formatter.format(totalIncome - totalExpenses)}
                                    </Typography>
                                    <Typography
                                        variant='body1'
                                        sx={{ fontWeight: 'bold' }}
                                        color={totalActualIncome - totalActualExpenses < 0 ? 'error.main' : 'success.main'}
                                    >
                                        {formatter.format(totalActualIncome - totalActualExpenses)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    sx={{ height: 6, borderRadius: 3, mt: 1 }}
                                    variant="determinate"
                                    color={(totalActualExpenses / totalActualIncome) > 1 ? 'error' : 'success'}
                                    value={Math.min((totalActualExpenses / (totalActualIncome || 1)) * 100, 100)}
                                />
                            </Paper>
                        </Box>

                        {overBudgetCategories.length > 0 && (
                            <Alert
                                severity="warning"
                                variant="outlined"
                                sx={{ py: 0, cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => setOverBudgetExpanded(prev => !prev)}
                                action={overBudgetExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            >
                                <Box>
                                    {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category' : 'categories'} over budget by {formatter.format(overBudgetTotal)}
                                    <Collapse in={overBudgetExpanded}>
                                        <List dense disablePadding sx={{ mt: 0.5 }}>
                                            {overBudgetCategories.map(cat => {
                                                const expenses = transactionsArray
                                                    .filter(t => t.categoryID === cat.recordID && t.transactionType === 'expense')
                                                    .reduce((a, t) => a + t.amount, 0);
                                                const incomes = transactionsArray
                                                    .filter(t => t.categoryID === cat.recordID && t.transactionType === 'income')
                                                    .reduce((a, t) => a + t.amount, 0);
                                                const overBy = (expenses - incomes) - cat.amount;
                                                return (
                                                    <ListItem key={cat.recordID} disablePadding sx={{ py: 0.25 }}>
                                                        <Typography variant="body2" sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{cat.categoryName}</span>
                                                            <span style={{ fontWeight: 600 }}>{formatter.format(overBy)}</span>
                                                        </Typography>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                </Box>
                            </Alert>
                        )}

                        {sectionsArray.filter(x => x.sectionType === 'income').map((row) => (
                            <BudgetSection sectionID={row.recordID} key={row.recordID} />
                        )
                        )}
                        {sectionsArray.filter(x => x.sectionType === 'expense').sort(function (a, b) {
                            //@ts-ignore
                            return sumCat(b.recordID) - sumCat(a.recordID);
                        }).map((row) => (
                            <BudgetSection sectionID={row.recordID} key={row.recordID} />
                        )
                        )}
                        <Button variant='outlined' color='secondary' startIcon={<PostAddIcon />} onClick={() => setAddNewSection(true)} disabled={offline}>Add Section</Button>
                    </Stack>
                </Box>

                {isDesktop && selectedCategory && (
                    <Box sx={{ flex: '0 1 360px', position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
                        <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ p: 1.5 }}>
                                <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                                    <Box>
                                        <Typography variant='overline' color='text.secondary'>
                                            {selectedSection?.sectionName}
                                            {selectedSection?.sectionType === 'income' ? ' · Income' : ' · Expense'}
                                        </Typography>
                                        {sidebarEditMode ? (
                                            <Box sx={{ mt: 0.5 }}>
                                                <TextField size='small' variant='filled' fullWidth
                                                    value={sidebarEditName}
                                                    onChange={(e) => setSidebarEditName(e.target.value)}
                                                    label="Category Name" sx={{ mb: 1 }} />
                                                <TextField size='small' variant='filled' fullWidth type="number"
                                                    value={sidebarEditAmount}
                                                    onChange={(e) => setSidebarEditAmount(Number(e.target.value))}
                                                    label="Budget Amount"
                                                    slotProps={{
                                                        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                                                        htmlInput: { step: 'any' },
                                                    }} />
                                                <Button size='small' fullWidth variant='contained' startIcon={<SaveIcon />}
                                                    sx={{ mt: 1 }}
                                                    disabled={offline}
                                                    onClick={async () => {
                                                        const err = await updateCategory(sidebarEditName, sidebarEditAmount);
                                                        if (!err) setSidebarEditMode(false);
                                                    }}>
                                                    Save
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Typography variant='h6'>{selectedCategory.categoryName}</Typography>
                                        )}
                                    </Box>
                                    <IconButton size='small' onClick={(e) => setSidebarAnchorEl(e.currentTarget)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                                <Box display='flex' justifyContent='space-between' sx={{ mt: 0.5 }}>
                                    <Typography variant='body2' color='text.secondary'>
                                        Budgeted: {formatter.format(selectedCategory.amount)}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        Tracked: {formatter.format(Math.abs(sidebarTracked))}
                                    </Typography>
                                    <Typography
                                        variant='body2'
                                        sx={{ fontWeight: 'bold' }}
                                        color={sidebarRemaining < 0 ? 'error.main' : 'success.main'}
                                    >
                                        Left: {formatter.format(sidebarRemaining)}
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    sx={{ height: 4, borderRadius: 2, mt: 1 }}
                                    variant="determinate"
                                    color={sidebarSpent > selectedCategory.amount ? 'error' : 'success'}
                                    value={Math.min((sidebarSpent / (selectedCategory.amount || 1)) * 100, 100)}
                                />
                            </Box>
                            <Box sx={{ px: 1.5, pb: 1 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    size="small"
                                    value={sidebarNote}
                                    onChange={(e) => setSidebarNote(e.target.value)}
                                    onBlur={async () => {
                                        if (sidebarNote !== (selectedCategory?.categoryNote || '')) {
                                            await updateCategory(
                                                selectedCategory.categoryName,
                                                selectedCategory.amount,
                                                sidebarNote
                                            );
                                        }
                                    }}
                                    label="Notes"
                                    placeholder="Add notes for this category..."
                                    disabled={offline}
                                />
                            </Box>
                            <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {sidebarTransactions.length > 0 ? sidebarTransactions.map((row) => (
                                    <React.Fragment key={row.recordID}>
                                        <Divider />
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => {
                                                setCurrentTransaction(row.recordID);
                                                setOpenEditTransaction(true);
                                            }}>
                                                <Grid container columnSpacing={1} alignItems='center' sx={{ width: '100%' }}>
                                                    <Grid size={1.5}>
                                                        <Avatar sx={{ fontSize: 13, textAlign: 'center', bgcolor: 'primary.light', width: 36, height: 36 }}>
                                                            {dayjs(row.transactionDate).format('MMM DD')}
                                                        </Avatar>
                                                    </Grid>
                                                    <Grid size='grow'>
                                                        <Typography variant='body2'>{row.title}</Typography>
                                                    </Grid>
                                                    <Grid size='auto'>
                                                        <Typography variant='body2'>
                                                            {(row.transactionType === 'expense' ? '-' : '+') + formatter.format(row.amount)}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </ListItemButton>
                                        </ListItem>
                                    </React.Fragment>
                                )) : (
                                    <ListItem>
                                        <Typography variant='body2' color='text.secondary'>No transactions yet</Typography>
                                    </ListItem>
                                )}
                            </List>
                        </Paper>
                    </Box>
                )}
            </Box>
            <Menu
                anchorEl={sidebarAnchorEl}
                open={sidebarMenuOpen}
                onClose={() => setSidebarAnchorEl(null)}
            >
                <MenuItem onClick={() => {
                    setSidebarAnchorEl(null);
                    setSidebarEditName(selectedCategory?.categoryName || '');
                    setSidebarEditAmount(selectedCategory?.amount || 0);
                    setSidebarEditMode(true);
                }}>
                    <EditIcon sx={{ mr: 1 }} />Edit Category
                </MenuItem>
                <MenuItem onClick={() => { setSidebarAnchorEl(null); balanceCategory(); }} disabled={offline}>
                    <BalanceIcon sx={{ mr: 1 }} />Balance Category
                </MenuItem>
                <MenuItem onClick={() => { setSidebarAnchorEl(null); allocateRestOfBudget(); }} disabled={offline}>
                    <AccountBalanceWalletIcon sx={{ mr: 1 }} />Allocate Rest of Budget
                </MenuItem>
                <MenuItem onClick={() => { setSidebarAnchorEl(null); setPendingDelete(true); promptDeleteCategory(); }} disabled={offline}>
                    <DeleteIcon sx={{ mr: 1 }} />Delete Category
                </MenuItem>
            </Menu>
            <Menu
                slotProps={{
                    list: {
                        'aria-labelledby': 'long-button',
                    },
                }}
                anchorEl={anchorEl1}
                open={moreOpen}
                onClose={closeOptions}
            >
                <MenuItem onClick={copyBudgetClick} disabled={offline}>
                    <CopyAllIcon sx={{ mr: 1 }} />
                    Copy budget outline
                </MenuItem>
            </Menu>
            <AddCategory />
            <AddSection />
            <EditCategory />
            <EditSection />
            <CopyBudget />
        </>
    )
}
