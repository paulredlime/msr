import Layout from "./Layout.jsx";

import ShoppingLists from "./ShoppingLists";

import AdminDashboard from "./AdminDashboard";

import ComparisonResults from "./ComparisonResults";

import Profile from "./Profile";

import AdminSettings from "./AdminSettings";

import SuperAdmin from "./SuperAdmin";

import AdminNotifications from "./AdminNotifications";

import PlanManagement from "./PlanManagement";

import Pricing from "./Pricing";

import Favorites from "./Favorites";

import FoodTakeaways from "./FoodTakeaways";

import AdminMessages from "./AdminMessages";

import Home from "./Home";

import LandingPageEditor from "./LandingPageEditor";

import UserManagement from "./UserManagement";

import BackendHandoffDocs from "./BackendHandoffDocs";

import RestaurantBackendHandoff from "./RestaurantBackendHandoff";

import ManualBasket from "./ManualBasket";

import BrowserExtensionHandoff from "./BrowserExtensionHandoff";

import bookmarkletsetup from "./bookmarkletsetup";

import FoodBackendHandoff from "./FoodBackendHandoff";

import GroceryBackendHandoff from "./GroceryBackendHandoff";

import AdminMatching from "./AdminMatching";

import RestaurantBrowser from "./RestaurantBrowser";

import AdminErrorLogs from "./AdminErrorLogs";

import CouponManagement from "./CouponManagement";

import AdminZyteDashboard from "./AdminZyteDashboard";

import AdminDataAudit from "./AdminDataAudit";

import AdminLoyaltyCookies from "./AdminLoyaltyCookies";

import ZyteIntegrationHandoff from "./ZyteIntegrationHandoff";

import ConnectivityCheck from "./ConnectivityCheck";

import AuditGrocers from "./AuditGrocers";

import AuditQuarantine from "./AuditQuarantine";

import ProductsApi from "./ProductsApi";

import AuditRestaurants from "./AuditRestaurants";

import ZyteOrdersFetch from "./ZyteOrdersFetch";

import TestOrderFetch from "./TestOrderFetch";

import AdminProductIngestion from "./AdminProductIngestion";

import ZyteRestaurantsFetch from "./ZyteRestaurantsFetch";

import UrlVerify from "./UrlVerify";

import ZyteGrocersFetch from "./ZyteGrocersFetch";

import ZyteApiEndpoint from "./ZyteApiEndpoint";

import TestApiConnection from "./TestApiConnection";

import ZyteScraperTest from "./ZyteScraperTest";

import OrdersFetcherTest from "./OrdersFetcherTest";

import AdminOrdersFetcher from "./AdminOrdersFetcher";

import Diagnostics from "./Diagnostics";

import CrawlManager from "./CrawlManager";

import AdminCrawlDashboard from "./AdminCrawlDashboard";

import BulkCategoryRunner from "./BulkCategoryRunner";

import Dashboard from "./Dashboard";

import ExtensionApiSpec from "./ExtensionApiSpec";

import AdminScannedProducts from "./AdminScannedProducts";

import MyScannedProducts from "./MyScannedProducts";

import PaymentSuccess from "./PaymentSuccess";

import PaymentCancelled from "./PaymentCancelled";

import IngestionEndpoints from "./IngestionEndpoints";

import AppConfig from "./AppConfig";

import MobileApp from "./MobileApp";

import MobileAppPreview from "./MobileAppPreview";

import MealPlanner from "./MealPlanner";

import SmartInventory from "./SmartInventory";

import CouponsDeals from "./CouponsDeals";

import BudgetTracker from "./BudgetTracker";

import PricePredictions from "./PricePredictions";

import VoiceShopping from "./VoiceShopping";

import FamilySharing from "./FamilySharing";

import Recipes from "./Recipes";

import BulkCalculator from "./BulkCalculator";

import SeasonalDeals from "./SeasonalDeals";

import LocalDeals from "./LocalDeals";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ShoppingLists: ShoppingLists,
    
    AdminDashboard: AdminDashboard,
    
    ComparisonResults: ComparisonResults,
    
    Profile: Profile,
    
    AdminSettings: AdminSettings,
    
    SuperAdmin: SuperAdmin,
    
    AdminNotifications: AdminNotifications,
    
    PlanManagement: PlanManagement,
    
    Pricing: Pricing,
    
    Favorites: Favorites,
    
    FoodTakeaways: FoodTakeaways,
    
    AdminMessages: AdminMessages,
    
    Home: Home,
    
    LandingPageEditor: LandingPageEditor,
    
    UserManagement: UserManagement,
    
    BackendHandoffDocs: BackendHandoffDocs,
    
    RestaurantBackendHandoff: RestaurantBackendHandoff,
    
    ManualBasket: ManualBasket,
    
    BrowserExtensionHandoff: BrowserExtensionHandoff,
    
    bookmarkletsetup: bookmarkletsetup,
    
    FoodBackendHandoff: FoodBackendHandoff,
    
    GroceryBackendHandoff: GroceryBackendHandoff,
    
    AdminMatching: AdminMatching,
    
    RestaurantBrowser: RestaurantBrowser,
    
    AdminErrorLogs: AdminErrorLogs,
    
    CouponManagement: CouponManagement,
    
    AdminZyteDashboard: AdminZyteDashboard,
    
    AdminDataAudit: AdminDataAudit,
    
    AdminLoyaltyCookies: AdminLoyaltyCookies,
    
    ZyteIntegrationHandoff: ZyteIntegrationHandoff,
    
    ConnectivityCheck: ConnectivityCheck,
    
    AuditGrocers: AuditGrocers,
    
    AuditQuarantine: AuditQuarantine,
    
    ProductsApi: ProductsApi,
    
    AuditRestaurants: AuditRestaurants,
    
    ZyteOrdersFetch: ZyteOrdersFetch,
    
    TestOrderFetch: TestOrderFetch,
    
    AdminProductIngestion: AdminProductIngestion,
    
    ZyteRestaurantsFetch: ZyteRestaurantsFetch,
    
    UrlVerify: UrlVerify,
    
    ZyteGrocersFetch: ZyteGrocersFetch,
    
    ZyteApiEndpoint: ZyteApiEndpoint,
    
    TestApiConnection: TestApiConnection,
    
    ZyteScraperTest: ZyteScraperTest,
    
    OrdersFetcherTest: OrdersFetcherTest,
    
    AdminOrdersFetcher: AdminOrdersFetcher,
    
    Diagnostics: Diagnostics,
    
    CrawlManager: CrawlManager,
    
    AdminCrawlDashboard: AdminCrawlDashboard,
    
    BulkCategoryRunner: BulkCategoryRunner,
    
    Dashboard: Dashboard,
    
    ExtensionApiSpec: ExtensionApiSpec,
    
    AdminScannedProducts: AdminScannedProducts,
    
    MyScannedProducts: MyScannedProducts,
    
    PaymentSuccess: PaymentSuccess,
    
    PaymentCancelled: PaymentCancelled,
    
    IngestionEndpoints: IngestionEndpoints,
    
    AppConfig: AppConfig,
    
    MobileApp: MobileApp,
    
    MobileAppPreview: MobileAppPreview,
    
    MealPlanner: MealPlanner,
    
    SmartInventory: SmartInventory,
    
    CouponsDeals: CouponsDeals,
    
    BudgetTracker: BudgetTracker,
    
    PricePredictions: PricePredictions,
    
    VoiceShopping: VoiceShopping,
    
    FamilySharing: FamilySharing,
    
    Recipes: Recipes,
    
    BulkCalculator: BulkCalculator,
    
    SeasonalDeals: SeasonalDeals,
    
    LocalDeals: LocalDeals,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ShoppingLists />} />
                
                
                <Route path="/ShoppingLists" element={<ShoppingLists />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/ComparisonResults" element={<ComparisonResults />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/AdminSettings" element={<AdminSettings />} />
                
                <Route path="/SuperAdmin" element={<SuperAdmin />} />
                
                <Route path="/AdminNotifications" element={<AdminNotifications />} />
                
                <Route path="/PlanManagement" element={<PlanManagement />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/Favorites" element={<Favorites />} />
                
                <Route path="/FoodTakeaways" element={<FoodTakeaways />} />
                
                <Route path="/AdminMessages" element={<AdminMessages />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/LandingPageEditor" element={<LandingPageEditor />} />
                
                <Route path="/UserManagement" element={<UserManagement />} />
                
                <Route path="/BackendHandoffDocs" element={<BackendHandoffDocs />} />
                
                <Route path="/RestaurantBackendHandoff" element={<RestaurantBackendHandoff />} />
                
                <Route path="/ManualBasket" element={<ManualBasket />} />
                
                <Route path="/BrowserExtensionHandoff" element={<BrowserExtensionHandoff />} />
                
                <Route path="/bookmarkletsetup" element={<bookmarkletsetup />} />
                
                <Route path="/FoodBackendHandoff" element={<FoodBackendHandoff />} />
                
                <Route path="/GroceryBackendHandoff" element={<GroceryBackendHandoff />} />
                
                <Route path="/AdminMatching" element={<AdminMatching />} />
                
                <Route path="/RestaurantBrowser" element={<RestaurantBrowser />} />
                
                <Route path="/AdminErrorLogs" element={<AdminErrorLogs />} />
                
                <Route path="/CouponManagement" element={<CouponManagement />} />
                
                <Route path="/AdminZyteDashboard" element={<AdminZyteDashboard />} />
                
                <Route path="/AdminDataAudit" element={<AdminDataAudit />} />
                
                <Route path="/AdminLoyaltyCookies" element={<AdminLoyaltyCookies />} />
                
                <Route path="/ZyteIntegrationHandoff" element={<ZyteIntegrationHandoff />} />
                
                <Route path="/ConnectivityCheck" element={<ConnectivityCheck />} />
                
                <Route path="/AuditGrocers" element={<AuditGrocers />} />
                
                <Route path="/AuditQuarantine" element={<AuditQuarantine />} />
                
                <Route path="/ProductsApi" element={<ProductsApi />} />
                
                <Route path="/AuditRestaurants" element={<AuditRestaurants />} />
                
                <Route path="/ZyteOrdersFetch" element={<ZyteOrdersFetch />} />
                
                <Route path="/TestOrderFetch" element={<TestOrderFetch />} />
                
                <Route path="/AdminProductIngestion" element={<AdminProductIngestion />} />
                
                <Route path="/ZyteRestaurantsFetch" element={<ZyteRestaurantsFetch />} />
                
                <Route path="/UrlVerify" element={<UrlVerify />} />
                
                <Route path="/ZyteGrocersFetch" element={<ZyteGrocersFetch />} />
                
                <Route path="/ZyteApiEndpoint" element={<ZyteApiEndpoint />} />
                
                <Route path="/TestApiConnection" element={<TestApiConnection />} />
                
                <Route path="/ZyteScraperTest" element={<ZyteScraperTest />} />
                
                <Route path="/OrdersFetcherTest" element={<OrdersFetcherTest />} />
                
                <Route path="/AdminOrdersFetcher" element={<AdminOrdersFetcher />} />
                
                <Route path="/Diagnostics" element={<Diagnostics />} />
                
                <Route path="/CrawlManager" element={<CrawlManager />} />
                
                <Route path="/AdminCrawlDashboard" element={<AdminCrawlDashboard />} />
                
                <Route path="/BulkCategoryRunner" element={<BulkCategoryRunner />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/ExtensionApiSpec" element={<ExtensionApiSpec />} />
                
                <Route path="/AdminScannedProducts" element={<AdminScannedProducts />} />
                
                <Route path="/MyScannedProducts" element={<MyScannedProducts />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/PaymentCancelled" element={<PaymentCancelled />} />
                
                <Route path="/IngestionEndpoints" element={<IngestionEndpoints />} />
                
                <Route path="/AppConfig" element={<AppConfig />} />
                
                <Route path="/MobileApp" element={<MobileApp />} />
                
                <Route path="/MobileAppPreview" element={<MobileAppPreview />} />
                
                <Route path="/MealPlanner" element={<MealPlanner />} />
                
                <Route path="/SmartInventory" element={<SmartInventory />} />
                
                <Route path="/CouponsDeals" element={<CouponsDeals />} />
                
                <Route path="/BudgetTracker" element={<BudgetTracker />} />
                
                <Route path="/PricePredictions" element={<PricePredictions />} />
                
                <Route path="/VoiceShopping" element={<VoiceShopping />} />
                
                <Route path="/FamilySharing" element={<FamilySharing />} />
                
                <Route path="/Recipes" element={<Recipes />} />
                
                <Route path="/BulkCalculator" element={<BulkCalculator />} />
                
                <Route path="/SeasonalDeals" element={<SeasonalDeals />} />
                
                <Route path="/LocalDeals" element={<LocalDeals />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}