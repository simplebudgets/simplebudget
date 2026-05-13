import * as React from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import AddIcon from "@mui/icons-material/Add";
import Fab from '@mui/material/Fab';
import {
  themes,
  useGlobalStore
} from "./store/globalStore";
import { useTableStore } from "./store/tableStore";
import { useModalStore } from "./store/modalStore";
import AppToolbar from './components/subcomponents/AppToolbar'
import Toolbar from '@mui/material/Toolbar';
import { Navigate, Outlet } from "react-router-dom";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PaidIcon from '@mui/icons-material/Paid';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { redirect, useLocation } from "react-router-dom";
import {
  Link as RouterLink,
} from 'react-router-dom';
import AddBudget from "./components/modals/AddBudget";
import {
  supaBudgetsByCreator,
  supaBudgetsByID,
  supaShared,
} from "./components/extras/api_functions";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
import useGrabBudgetData from "./components/extras/GrabBudgetData";
import SelectBudget from "./components/modals/SelectBudget";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import AddTransaction from "./components/modals/AddTransaction";
import Badge from '@mui/material/Badge';
import AreYouSure from "./components/subcomponents/AreYouSure";
import EditTransaction from "./components/modals/EditTransaction";
import UpdatePrompt from "./components/subcomponents/UpdatePrompt";
import { usePwaStore } from "./store/pwaStore";
import { initOfflineSync } from "./lib/offlineSync";
import { useOfflineStore } from "./store/offlineStore";
import CloudOffIcon from '@mui/icons-material/CloudOff';

const fabStyle = {
  position: 'fixed',
  bottom: 75,
  right: 16,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function App() {
  let location = useLocation();
  const currentTheme = useGlobalStore(s => s.themeAtom);
  const { grabBudgetData } = useGrabBudgetData();
  const snackText = useGlobalStore(s => s.snackBarText);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  const snackSev = useGlobalStore(s => s.snackBarSeverity);
  const snackOpen = useGlobalStore(s => s.snackBarOpen);
  const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
  const [actTheme, setTheme] = React.useState(themes.darkTheme);
  const [tabValue, setTabValue] = React.useState(location.pathname);
  const setBudgetArray = useTableStore(s => s.setBudgets)
  const setAddNewTransaction = useModalStore(s => s.setAddTransaction)
  const setSelectBudget = useModalStore(s => s.setSelectBudget)
  const needRefresh = usePwaStore(s => s.needRefresh)
  const setNeedRefresh = usePwaStore(s => s.setNeedRefresh)
  const pwaUpdateSW = usePwaStore(s => s.updateSW)
  const setSectionArray = useTableStore(s => s.setSections)
  const setCategoryArray = useTableStore(s => s.setCategories)
  const transactionArray = useTableStore(s => s.transactions)
  const setTransactionArray = useTableStore(s => s.setTransactions)
  const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
  const setCurrentBudget = useTableStore(s => s.setCurrentBudgetAndMonth)
  const setCreateNewBudget = useModalStore(s => s.setAddBudget);
  const currentUserInfo = useGlobalStore(s => s.currentUser)
  const [unCategorized, setUncategorized] = React.useState(transactionArray.filter((x: any) => x.categoryID === null).length)
  const loadingOpen = useGlobalStore(s => s.mainLoading)
  const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
  const [addToHomePU, setAddToHomePU] = React.useState(false)
  const isOnline = useOfflineStore(s => s.isOnline)
  const offlinePendingCount = useOfflineStore(s => s.pendingCount)

  // Initialize offline sync listeners
  React.useEffect(() => {
    const cleanup = initOfflineSync();
    return cleanup;
  }, []);

  const addToHomeClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') { return }
    setAddToHomePU(false);
  };

  React.useEffect(() => {
    setUncategorized(transactionArray.filter((x: any) => x.categoryID === null).length)
  }, [transactionArray])

  React.useEffect(() => {
    supaRefresh()
  }, [])

  React.useEffect(() => {
    if (currentTheme === 'dark') {
      setTheme(themes.darkTheme)
    } else if (currentTheme === 'light') {
      setTheme(themes.lightTheme)
    }
  }, [currentTheme])

  if (localStorage.getItem('sb-psdmjjcvaxejxktqwdcm-auth-token') === null) { return <Navigate to="/login" /> }

  if (location.pathname === '/') { return <Navigate to="/budget" /> }

  const snackClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') { return }
    setSnackOpen(false);
  };

  async function grabAllBudgets() {
    let myBudgets = await supaBudgetsByCreator(currentUserInfo.recordID)
    let foundBudgets = myBudgets
    let sharedBudgetIDs = await supaShared(currentUserInfo.recordID)
    if (sharedBudgetIDs && sharedBudgetIDs.length > 0) {
      let sharedBudgets = await supaBudgetsByID(sharedBudgetIDs.map(x => x.budgetID))
      //@ts-ignore
      foundBudgets = myBudgets.concat(sharedBudgets.data)
    }
    return foundBudgets
  }

  async function setBudget(allBudgets: any[] | null) {
    if (allBudgets) {
      if (allBudgets.length > 0) {
        await setBudgetArray(allBudgets)
        let resolvedBudget = {
          budgetID: currentBudget.budgetID,
          year: currentBudget.year,
          month: currentBudget.month,
        }
        if (allBudgets.length === 1) {
          resolvedBudget = {
            budgetID: allBudgets[0].recordID,
            year: currentBudget.year,
            month: currentBudget.month,
          }
          await setCurrentBudget(resolvedBudget)
          localStorage.setItem('currentBudget', JSON.stringify(resolvedBudget))
        } else if (allBudgets.length > 1) { //if there's multiple, check if localStorage budget exists in the array
          let posCurrent = localStorage.getItem('currentBudget')
          if (posCurrent !== null) {
            const parsed = JSON.parse(posCurrent || '{}')
            if (allBudgets.find(x => x.recordID === parsed.budgetID)) {
              resolvedBudget = {
                budgetID: parsed.budgetID,
                year: currentBudget.year,
                month: currentBudget.month,
              }
              setCurrentBudget(resolvedBudget)
            }
          } //if there's nothing in localstorage, open the selector for the user to choose
          else {
            setSelectBudget(true)
          }
        }
        await grabBudgetData(resolvedBudget.budgetID, resolvedBudget.year, resolvedBudget.month)
      } else if (allBudgets.length === 0) {
        setBudgetArray([])
        setSectionArray([])
        setCategoryArray([])
        setTransactionArray([])
        //@ts-ignore
        setCurrentBudget({})
        setCreateNewBudget(true)
        localStorage.removeItem('currentBudget')
      }
    }
  }

  async function supaRefresh() {
    setLoadingOpen(true)
    let allBudgets = await grabAllBudgets()
    let curBudget = await setBudget(allBudgets)
    setLoadingOpen(false)
  }
  return (
    <>
      <ThemeProvider theme={actTheme}>
        <CssBaseline />
        <Box sx={{
          display: 'flex',
          minHeight: window.innerHeight,
          backgroundImage: (currentTheme === 'dark' ? 'linear-gradient(to bottom right, #161616, #252525)' : 'linear-gradient(to bottom right,#eee,#fff)'),
          bgcolor: (currentTheme === 'dark' ? '#171717' : 'grey.100')
        }}>
          <Box sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}><AppToolbar /></Box>
          <Box component="main"
            sx={{ width: '100%', p: 2, mb: 8, height: '100%', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}>
            <Toolbar /><Outlet />
          </Box>
          <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} elevation={3}>
            <BottomNavigation
              showLabels
              value={tabValue}
              onChange={(event, newValue: string) => {
                setTabValue(newValue);
                redirect("/" + newValue)
              }}>
              <BottomNavigationAction label="Budget" value='/budget' component={RouterLink} to="budget" icon={<DashboardIcon />} />
              <BottomNavigationAction label="Transactions" value='/transactions' component={RouterLink} to="transactions" icon={<Badge badgeContent={unCategorized} color="secondary"><PaidIcon /></Badge>} />
              {matches ? null : <Fab color='secondary' sx={{ alignSelf: 'center', position: 'absolute', mb: 9 }} size="medium"
                onClick={() => setAddNewTransaction(true)}><AddIcon /></Fab>}
              <BottomNavigationAction label="Analytics" value='/analytics' component={RouterLink} to="analytics" icon={<AssessmentIcon />} />
              <BottomNavigationAction label="Settings" value='/settings' component={RouterLink} to="settings" icon={<SettingsIcon />} />
            </BottomNavigation>
          </Paper>
        </Box>
        {matches ? <Fab color="secondary" variant='extended' sx={fabStyle} onClick={() => setAddNewTransaction(true)}>
          <AddIcon /> Add Transaction
        </Fab> : null}
        <Snackbar open={snackOpen} autoHideDuration={2000} onClose={snackClose} sx={{ mb: 8 }}>
          {/*@ts-ignore*/}
          <Alert onClose={snackClose} severity={snackSev} sx={{ width: '100%' }}>
            {snackText}
          </Alert>
        </Snackbar>
        <Snackbar open={addToHomePU} autoHideDuration={2000} onClose={addToHomeClose} sx={{ mb: 8 }}>
          {/*@ts-ignore*/}
          <Alert onClose={addToHomeClose} severity="info" sx={{ width: '100%' }}>
            "Install this webapp"
          </Alert>
        </Snackbar>
        <AddBudget />
        <AddTransaction />
        <EditTransaction />
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 200 }}
          open={loadingOpen}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <SelectBudget />
        <AreYouSure />
        <UpdatePrompt
          open={needRefresh}
          onUpdate={() => { if (pwaUpdateSW) pwaUpdateSW(true); }}
          onDismiss={() => setNeedRefresh(false)}
        />
        {/* Offline indicator */}
        <Snackbar
          open={!isOnline || offlinePendingCount > 0}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 7 }}
        >
          <Alert
            severity={!isOnline ? 'warning' : 'info'}
            icon={<CloudOffIcon />}
            sx={{ width: '100%' }}
          >
            {!isOnline
              ? `You're offline. ${offlinePendingCount > 0 ? `${offlinePendingCount} transaction(s) will sync when reconnected.` : 'Transactions will be saved locally.'}`
              : `Syncing ${offlinePendingCount} offline transaction(s)...`}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </>
  );
}
