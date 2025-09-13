
import React, { useState, useEffect, useCallback } from "react";
import { ShoppingList } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations"; // Added UploadFile
import ErrorTracker from "../components/services/ErrorTracker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Plus,
  ShoppingCart,
  Trash2,
  Edit3,
  Search,
  ListChecks,
  Calendar,
  DollarSign,
  PlayCircle,
  Download,
  ChevronRight,
  Link as LinkIcon,
  UtensilsCrossed,
  Upload,
  Info,
  Loader2,
  Sparkles,
  CheckCircle,
  Clock,
  Camera, // Added Camera
  Smartphone, // Added Smartphone
  AlertTriangle, // Added AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AutoFillBasketButton from "@/components/AutoFillBasketButton";
import { toast } from "sonner"; // Added toast
import ClarificationModal from "@/components/ClarificationModal"; // Added ClarificationModal

const supermarkets = {
  "Tesco": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/66c4c6105_image.png",
  "ASDA": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b91670333_image.png",
  "Sainsbury's": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/10fb1e1cb_image.png",
  "Morrisons": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/85bf5ae51_image.png",
  "Aldi": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2007112e1_image.png",
  "Lidl": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/9a5bac9cb_image.png",
  "Co-op": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/bb1f8329b_image.png",
  "Waitrose": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5b3ae72b5_image.png",
  "Iceland": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0c3344c55_image.png",
  "Ocado": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ae15bfc78_image.png",
};

// NEW: Map for popular restaurant logos
const restaurantLogos = {
  "mcdonald's": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b75371343_image.png",
  "kfc": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/155b41050_image.png",
  "burger king": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8c8d83921_image.png",
  "pizza hut": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b2b8c3479_image.png",
  "domino's pizza": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2f122839b_image.png",
  "subway": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d64c2084b_image.png",
};

const storeDetectionKeywords = {
  "Tesco": ['tesco'],
  "ASDA": ['asda'],
  "Sainsbury's": ['sainsbury', 'sainsbury\'s'],
  "Morrisons": ['morrisons'],
  "Aldi": ['aldi'],
  "Lidl": ['lidl'],
  "Waitrose": ['waitrose'],
  "Co-op": ['co-op', 'coop'],
  "Iceland": ['iceland'],
  "Ocado": ['ocado']
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// NEW: Clarification terms for ambiguous items
const clarificationTerms = ['milk', 'eggs', 'bread', 'butter', 'cheese', 'sausages', 'chicken', 'potatoes', 'onions'];

export default function ShoppingLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [historicalLists, setHistoricalLists] = useState([]);
  const [allDbLists, setAllDbLists] = useState([]); // New state for all lists fetched from DB
  const [totalLists, setTotalLists] = useState(0);
  const [activeTab, setActiveTab] = useState('my-lists');

  // NEW: States for image upload and OCR
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  // NEW: States for clarification modal
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [ambiguousItems, setAmbiguousItems] = useState([]);
  const [originalPastedList, setOriginalPastedList] = useState("");
  const [listNameForClarification, setListNameForClarification] = useState(""); // Store list name for clarification flow

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [storeFilter, setStoreFilter] = useState("all"); // "all", "grocery", "takeaway", or specific supermarket name (lowercase)

  const navigate = useNavigate();

  const [newList, setNewList] = useState({
    name: "",
    original_text: "",
    source_supermarket: null,
    source_supermarket_logo: null
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [listToDeleteId, setListToDeleteId] = useState(null);

  // Added user state from outline, useful for stats or future features
  const [user, setUser] = useState(null);

  const loadUserData = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (e) {
      // Handle error or redirect if user not found/logged in
      console.error("Failed to load user data:", e);
      // navigate(createPageUrl("Home")); // Not redirecting to preserve current page view.
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);


  // New useEffect to fetch all lists once on component mount
  useEffect(() => {
    const fetchAllLists = async () => {
      setLoading(true);
      try {
        const all_lists = await ShoppingList.list('-created_date');
        setAllDbLists(all_lists);
      } catch (error) {
        console.error('Error fetching all lists:', error);
        const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR902');
        setModalContent({
          title: userError.title,
          description: `${userError.message} ${userError.supportMessage || ''}`
        });
        setShowInfoModal(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLists();
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to identify takeaway lists
  const isTakeawayList = useCallback((list) => {
    return list.name?.toLowerCase().includes('order - ');
  }, []);

  const loadShoppingLists = useCallback(() => {
    let preliminaryFilteredLists = [];

    // First, filter based on active tab AND store filter
    if (activeTab === 'my-lists') {
      // If "my-lists" tab is active, apply the storeFilter
      if (storeFilter === "all" || storeFilter === "grocery") {
        preliminaryFilteredLists = allDbLists.filter(list => !isTakeawayList(list));
      } else if (storeFilter === "takeaway") {
        // If storeFilter is set to 'takeaway' within 'my-lists' tab, show takeaways.
        preliminaryFilteredLists = allDbLists.filter(list => isTakeawayList(list));
      } else { // Specific supermarket
        preliminaryFilteredLists = allDbLists.filter(list =>
          !isTakeawayList(list) && list.source_supermarket?.toLowerCase() === storeFilter
        );
      }
    } else if (activeTab === 'takeaway-lists') {
      // If "takeaway-lists" tab is active, only show takeaways, ignore storeFilter dropdown
      preliminaryFilteredLists = allDbLists.filter(list => isTakeawayList(list));
    }
    // For 'import-history' tab, 'lists' will remain empty, as it's not displaying existing lists.

    // Apply search term on the preliminary filtered lists
    const searchedLists = preliminaryFilteredLists.filter(list =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Set total count for the currently viewable and searched lists (before pagination)
    setTotalLists(searchedLists.length);

    // Apply pagination (slice)
    const offset = (currentPage - 1) * itemsPerPage;
    const paginatedLists = searchedLists.slice(offset, offset + itemsPerPage);

    setLists(paginatedLists); // `lists` now contains the paginated, store-filtered, searched data.
  }, [allDbLists, activeTab, storeFilter, searchTerm, currentPage, itemsPerPage, isTakeawayList]);

  useEffect(() => {
    // Re-load when pagination/filters/search change, or when the master list (allDbLists) updates
    if (!loading) { // Only run if initial loading of allDbLists is complete
      loadShoppingLists();
    }
  }, [loadShoppingLists, loading]); // Added loading

  const detectSupermarketFromText = (text) => {
    const lowerText = text.toLowerCase();
    for (const storeName in storeDetectionKeywords) {
      const keywords = storeDetectionKeywords[storeName];
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return {
          name: storeName,
          logo: supermarkets[storeName]
        };
      }
    }
    return null;
  };

  const handleTextChange = (text) => {
    const detected = detectSupermarketFromText(text);
    setNewList(prev => ({
      ...prev,
      original_text: text,
      source_supermarket: detected ? detected.name : null,
      source_supermarket_logo: detected ? detected.logo : null
    }));
  };

  const getListSupermarketInfo = (list) => {
    if (list.source_supermarket && supermarkets[list.source_supermarket]) {
      return {
        name: list.source_supermarket,
        logo: supermarkets[list.source_supermarket]
      };
    }

    const textToSearch = (
      (list.name || '') + ' ' +
      (list.items?.slice(0, 10).map(item => item.name).join(' ') || '')
    ).toLowerCase();

    if (textToSearch) {
      for (const storeName in storeDetectionKeywords) {
        const keywords = storeDetectionKeywords[storeName];
        const found = keywords.some(keyword => textToSearch.includes(keyword));
        if (found) {
          return { name: storeName, logo: supermarkets[storeName] };
        }
      }
    }
    return null;
  };

  const parseShoppingList = async (text) => {
    const prompt = `
    Parse this shopping list text into structured items. Extract each item with quantity and category.

    Shopping list:
    ${text}

    Return the items as an array where each item has:
    - name: the product name
    - quantity: the amount/quantity (e.g., "2x", "1 bag", "500g")
    - category: grocery category (e.g., "dairy", "meat", "vegetables", "pantry", "frozen", "household")
    `;

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });
      return response.items || [];
    } catch (error) {
      console.error('Error parsing shopping list:', error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR903');
      setModalContent({
        title: userError.title,
        description: `${userError.message} ${userError.supportMessage || ''}`
      });
      setShowInfoModal(true);
      return [];
    }
  };

  // NEW: Extracted function for processing and creating list after all checks/clarifications
  const processAndCreateList = async (listName, listText, sourceSupermarket = null) => {
    try {
      const parsedItems = await parseShoppingList(listText);

      const listData = {
        name: listName,
        original_text: listText,
        items: parsedItems,
        status: "draft",
        source_supermarket: sourceSupermarket
      };

      const created = await ShoppingList.create(listData);

      // Update User Stats
      const currentUser = await User.me();
      await User.updateMyUserData({
        total_lists_created: (currentUser.total_lists_created || 0) + 1
      });

      setAllDbLists(prev => [created, ...prev]); // Add to our main list state to trigger re-render
      setShowCreateDialog(false);
      setNewList({ name: "", original_text: "", source_supermarket: null, source_supermarket_logo: null });
      toast.success("Your shopping list has been successfully created!");
    } catch (error) {
      console.error('Error creating shopping list:', error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR904');
      setModalContent({
        title: userError.title,
        description: `${userError.message} ${userError.supportMessage || ''}`
      });
      setShowInfoModal(true);
    } finally {
      setProcessing(false); // End processing regardless of success or failure
    }
  };

  const handleCreateList = async () => {
    if (!newList.name.trim() || !newList.original_text.trim()) {
      setModalContent({
        title: "Missing Information",
        description: "Please provide both a name and text for your shopping list."
      });
      setShowInfoModal(true);
      return;
    }

    setProcessing(true);
    const trimmedText = newList.original_text.trim();
    const listName = newList.name.trim();

    // Store the current list name for use in clarification flow
    setListNameForClarification(listName);

    // NEW: Smart Clarification Logic
    const lines = trimmedText.split('\n').map(line => line.trim().toLowerCase());
    const foundAmbiguousItems = [];

    lines.forEach(line => {
      const words = line.split(' ');
      clarificationTerms.forEach(term => {
        // Check if the term exists as a whole word in the line and not already added to ambiguous items
        if (new RegExp(`\\b${term}\\b`).test(line) && !foundAmbiguousItems.some(item => item.term === term)) {
          // Heuristic: if the line has more than 2 words, it's probably specific enough.
          // Example: "milk" (ambiguous) vs "almond milk" (specific)
          if (words.length <= 2) {
            foundAmbiguousItems.push({ term, line: line });
          }
        }
      });
    });

    if (foundAmbiguousItems.length > 0) {
      setOriginalPastedList(trimmedText);
      setAmbiguousItems(foundAmbiguousItems);
      setIsClarificationModalOpen(true);
      // Keep processing true, it will be set to false by processAndCreateList or handleClarificationComplete
    } else {
      // No ambiguous items, proceed directly
      await processAndCreateList(listName, trimmedText, newList.source_supermarket);
    }
  };

  // NEW: Callback for when clarification modal completes
  const handleClarificationComplete = async (clarifiedListText) => {
    setIsClarificationModalOpen(false);
    setAmbiguousItems([]); // Clear ambiguous items
    setOriginalPastedList(""); // Clear original text

    // Now proceed with the actual list creation using the clarified text
    // Use the stored list name for this creation
    await processAndCreateList(listNameForClarification, clarifiedListText, newList.source_supermarket);
  };

  const handleDeleteClick = (listId) => {
    setListToDeleteId(listId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteList = async () => {
    if (!listToDeleteId) return;

    try {
      await ShoppingList.delete(listToDeleteId);
      setAllDbLists(prev => prev.filter(list => list.id !== listToDeleteId)); // Remove from main list
      toast.success("The shopping list has been successfully deleted."); // Use toast for success
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR905');
      toast.error(`Failed to delete list: ${userError.message}`); // Use toast for error
    } finally {
      setShowDeleteDialog(false);
      setListToDeleteId(null);
    }
  };

  const handleStartComparison = (listId) => {
    navigate(createPageUrl(`ComparisonResults?id=${listId}`));
  };

  // Replace DataClient calls with demo data
  const handleFetchHistoricalLists = async () => {
    setIsFetchingHistory(true);
    setHistoricalLists([]);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500)); // Added a small delay for better UX

      // Demo data since DataClient is not available
      const demoData = [
        {
          id: "tesco",
          supermarket: "Tesco",
          logo: supermarkets["Tesco"],
          lists: [
            {
              id: "demo-tesco-order-1",
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
              items: [
                { name: "Milk", quantity: "1 bottle", category: "dairy" },
                { name: "Bread (Wholemeal)", quantity: "1 loaf", category: "bakery" },
                { name: "Eggs (Large)", quantity: "12 pack", category: "dairy" },
                { name: "Bananas", quantity: "6", category: "fruits" },
                { name: "Chicken Breast", quantity: "500g", category: "meat" },
                { name: "Broccoli", quantity: "1 head", category: "vegetables" }
              ],
              totalEstimated: "18.75"
            },
            {
              id: "demo-tesco-order-2",
              date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days ago
              items: [
                { name: "Pasta", quantity: "500g", category: "pantry" },
                { name: "Tomato Passata", quantity: "2 cans", category: "pantry" },
                { name: "Onions", quantity: "1kg", category: "vegetables" },
                { name: "Garlic", quantity: "1 bulb", category: "vegetables" }
              ],
              totalEstimated: "7.20"
            }
          ]
        },
        {
          id: "sainsburys",
          supermarket: "Sainsbury's",
          logo: supermarkets["Sainsbury's"],
          lists: [
            {
              id: "demo-sainsburys-order-1",
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
              items: [
                { name: "Yogurt (Greek)", quantity: "500g", category: "dairy" },
                { name: "Apples (Gala)", quantity: "4", category: "fruits" },
                { name: "Cereal (Corn Flakes)", quantity: "1 box", category: "breakfast" },
                { name: "Orange Juice", quantity: "1L", category: "drinks" }
              ],
              totalEstimated: "9.99"
            }
          ]
        },
        {
          id: "asda",
          supermarket: "ASDA",
          logo: supermarkets["ASDA"],
          lists: [
            {
              id: "demo-asda-order-1",
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
              items: [
                { name: "Frozen Peas", quantity: "1 bag", category: "frozen" },
                { name: "Fish Fingers", quantity: "10 pack", category: "frozen" },
                { name: "Washing Up Liquid", quantity: "1 bottle", category: "household" }
              ],
              totalEstimated: "11.50"
            }
          ]
        }
      ];

      setHistoricalLists(demoData);

    } catch (error) {
      console.error("Error in handleFetchHistoricalLists:", error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR901');
      setModalContent({
        title: userError.title,
        description: `${userError.message} ${userError.supportMessage || ''}`
      });
      setShowInfoModal(true);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleImportList = async (list, supermarket) => {
    try {
      const newListEntry = await ShoppingList.create({
        name: `${supermarket} Shop - ${new Date(list.date).toLocaleDateString()}`,
        original_text: list.items.map(i => `${i.quantity || ''} ${i.name}`).filter(Boolean).join('\n'),
        items: list.items.map(item => ({ ...item, category: item.category || 'unknown' })),
        status: 'draft',
        total_estimated_cost: parseFloat(list.totalEstimated),
        source_supermarket: supermarket
      });

      // Update User Stats
      const currentUser = await User.me();
      await User.updateMyUserData({
        total_lists_created: (currentUser.total_lists_created || 0) + 1
      });

      setAllDbLists(prev => [newListEntry, ...prev]); // Add to our main list state to trigger re-render

      // Reset states to show newly imported list in the main tab
      setCurrentPage(1);
      setStoreFilter("all"); // Default filter for new lists
      setSearchTerm("");
      setActiveTab('my-lists'); // Switch to 'my-lists' tab
      toast.success(`Successfully imported list from ${supermarket} on ${new Date(list.date).toLocaleDateString()}.`);
      navigate(createPageUrl(`ComparisonResults?id=${newListEntry.id}`));
    } catch (error) {
      console.error("Failed to import list:", error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR908');
      setModalContent({
        title: userError.title,
        description: `${userError.message} ${userError.supportMessage || ''}`
      });
      setShowInfoModal(true);
    }
  };

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files);
    setUploadedImages(fileArray);
  };

  const processOCRImages = async () => {
    if (uploadedImages.length === 0) return;

    setIsProcessingOCR(true);
    try {
      // Process uploaded images with OCR
      const uploadPromises = uploadedImages.map(async (file) => {
        const { file_url } = await UploadFile({ file });
        return file_url;
      });

      const imageUrls = await Promise.all(uploadPromises);

      const ocrResult = await InvokeLLM({
        prompt: `Extract shopping list items from these images. Return a clean shopping list with one item per line. Focus on grocery items, quantities, and brands.`,
        file_urls: imageUrls,
      });

      handleTextChange(ocrResult); // Use existing handler to set newList.original_text and detect supermarket
      setShowUploadModal(false);
      setUploadedImages([]);
    } catch (error) {
      console.error('OCR processing failed:', error);
      const userError = error.code ? error : ErrorTracker.getUserFriendlyError('ERR909'); // Assuming a new error code for OCR
      setModalContent({
        title: userError.title,
        description: `${userError.message} ${userError.supportMessage || ''}`
      });
      setShowInfoModal(true);
    }
    setIsProcessingOCR(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'comparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalLists / itemsPerPage);
  const startItem = totalLists === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalLists);

  // Get unique stores for filter dropdown (used in the My Lists tab)
  const availableStores = [
    { value: "all", label: "All Stores" },
    { value: "grocery", label: "Grocery Only" },
    { value: "takeaway", label: "Takeaway Only" },
    ...Object.keys(supermarkets).map(store => ({
      value: store.toLowerCase(),
      label: store
    }))
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ListCard = ({ list }) => {
    const isTakeaway = isTakeawayList(list);
    let logoSrc = null;
    let logoAlt = "";

    if (isTakeaway) {
      const restaurantName = list.name.split(' Order -')[0].toLowerCase();
      logoSrc = restaurantLogos[restaurantName];
      logoAlt = restaurantName;
    } else {
      const supermarketInfo = getListSupermarketInfo(list);
      if (supermarketInfo) {
        logoSrc = supermarketInfo.logo;
        logoAlt = supermarketInfo.name;
      }
    }

    return (
      <motion.div
        key={list.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="shadow-lg border-0 hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-3">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={logoAlt}
                      className="h-12 w-auto object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    isTakeaway ? <UtensilsCrossed className="w-5 h-5 text-orange-600" /> : <ShoppingCart className="w-5 h-5 text-teal-600" />
                  )}
                  {list.name}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(list.created_date).toLocaleDateString()}
                  </span>
                  <span>{list.items?.length || 0} items</span>
                  {list.total_estimated_cost && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      £{list.total_estimated_cost.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(list.status)} border`}>
                  {list.status}
                </Badge>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:border-red-200"
                    onClick={() => handleDeleteClick(list.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {list.items && list.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {list.items.slice(0, 9).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.quantity} {item.category && `• ${item.category}`}
                      </div>
                    </div>
                  </div>
                ))}
                {list.items.length > 9 && (
                  <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg text-sm text-gray-500">
                    +{list.items.length - 9} more items
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No items parsed yet</p>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <Button
                className={isTakeaway ? "bg-orange-600 hover:bg-orange-700" : "bg-teal-600 hover:bg-teal-700"}
                onClick={() => isTakeaway ? navigate(createPageUrl('FoodTakeaways')) : handleStartComparison(list.id)}
              >
                {isTakeaway ? (
                  <>
                    <UtensilsCrossed className="w-4 h-4 mr-2" />
                    View Takeaway Comparison
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Compare Prices
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <>
      <ClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => {
          setIsClarificationModalOpen(false);
          setProcessing(false); // Stop processing if modal is closed without completing
        }}
        ambiguousItems={ambiguousItems}
        originalList={originalPastedList}
        onComplete={handleClarificationComplete}
        // Assuming ClarificationModal doesn't need source_supermarket directly for its logic
      />

      <AlertDialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {modalContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowInfoModal(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your shopping list
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteList} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 md:p-8 bg-gradient-to-br from-teal-50/30 to-amber-50/30 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Lists</h1>
              <p className="text-gray-600">
                Create and manage your shopping lists for price comparison ({totalLists.toLocaleString()} total)
              </p>
            </div>

            {/* REPLACE the existing modal with this enhanced version */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New List
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Start Your Price Comparison</DialogTitle>
                  <DialogDescription>
                    Get your shopping list ready for comparison across all major UK supermarkets
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Mobile Tips Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      📱 Mobile Copy & Paste Tips
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>• <strong>From Email:</strong> Long-press text → Select All → Copy</p>
                      <p>• <strong>Store Apps:</strong> Use screenshot option below</p>
                      <p>• <strong>WhatsApp/Messages:</strong> Copy and paste directly</p>
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-blue-600 text-sm mt-2"
                      onClick={() => window.open('https://youtu.be/dQw4w9WgXcQ', '_blank')}
                    >
                      📺 Watch 2-minute tutorial
                    </Button>
                  </div>

                  {/* Screenshot Upload Option */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      📸 Can't Copy? Upload Screenshots
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload multiple screenshots and we'll extract items automatically
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadModal(true)}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Screenshots
                    </Button>
                  </div>

                  {/* Manual Entry */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">✏️ Manual Entry</h3>
                    <div className="mb-4"> {/* Added mb-4 for spacing */}
                      <Label htmlFor="name">List Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Weekly Shopping, BBQ Party List"
                        value={newList.name}
                        onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="list-input" className="text-base font-semibold">
                        Enter Your Shopping List
                      </Label>
                      <Textarea
                        id="list-input"
                        placeholder="Paste or type your shopping list here...

Examples:
Milk
Bread
Bananas, 1kg
Chicken breast
Or: Milk, Bread, Bananas"
                        value={newList.original_text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        rows={8}
                        className="mt-2"
                      />
                    </div>
                    {newList.source_supermarket_logo && (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <img src={newList.source_supermarket_logo} alt={newList.source_supermarket} className="h-12 w-auto" />
                        <p className="text-sm font-medium text-blue-800">
                          Detected list from {newList.source_supermarket}. We'll use this as your 'original price' supermarket for comparison.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    setProcessing(false); // Reset processing if dialog is cancelled
                  }} disabled={processing}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateList}
                    disabled={!newList.name.trim() || !newList.original_text.trim() || processing}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Comparing Prices
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* OCR Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Shopping List Screenshots</DialogTitle>
                  <DialogDescription>
                    Upload multiple images of your shopping list and we'll extract the items
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Click to select images or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div>
                      <p className="font-semibold">{uploadedImages.length} image(s) selected</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {uploadedImages.map((file, index) => (
                          <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {file.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={processOCRImages}
                    disabled={uploadedImages.length === 0 || isProcessingOCR}
                  >
                    {isProcessingOCR ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Extract Items'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="my-lists">
                <ShoppingCart className="w-4 h-4 mr-2" />
                My Lists ({allDbLists.filter(l => !isTakeawayList(l)).length})
              </TabsTrigger>
              <TabsTrigger value="takeaway-lists">
                <UtensilsCrossed className="w-4 h-4 mr-2" />
                Food Takeaways ({allDbLists.filter(l => isTakeawayList(l)).length})
              </TabsTrigger>
              <TabsTrigger value="import-history">
                <Download className="w-4 h-4 mr-2" />
                Import from History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-lists" className="mt-6">
              {/* Enhanced Filters Section */}
              <Card className="mb-6 shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Search */}
                    <div>
                      <Label htmlFor="search">Search Lists</Label>
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search shopping lists..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Store Filter */}
                    <div>
                      <Label htmlFor="store-filter">Filter by Store</Label>
                      <Select value={storeFilter} onValueChange={(value) => {
                        setStoreFilter(value);
                        setCurrentPage(1); // Reset to page 1 when filter changes
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="All stores" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStores.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Items Per Page */}
                    <div>
                      <Label htmlFor="per-page">Items per page</Label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1); // Reset to page 1 when items per page changes
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map(option => (
                            <SelectItem key={option} value={option.toString()}>
                              {option} per page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page Info - Moved below filters for consistent layout */}
                    <div className="text-sm text-gray-600 whitespace-nowrap hidden md:block">
                      Showing {startItem}-{endItem} of {totalLists} lists
                    </div>
                  </div>
                </CardContent>
              </Card>

              <AnimatePresence>
                {lists.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      {lists.map((list) => (
                        <ListCard key={list.id} list={list} />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalLists > 0 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <span className="text-sm text-gray-700">
                          Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalLists)}</span> of <span className="font-semibold">{totalLists}</span> lists
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-700 px-2">
                            Page {currentPage} of {Math.ceil(totalLists / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalLists / itemsPerPage)))}
                            disabled={currentPage >= Math.ceil(totalLists / itemsPerPage) || totalLists === 0}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="w-12 h-12 text-teal-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {searchTerm || storeFilter !== "all" || activeTab !== "my-lists" ? 'No matching lists found' : 'No supermarket lists yet'}
                      </h3>
                      <p className="text-gray-500 mb-8">
                        {searchTerm || storeFilter !== "all" || activeTab === "takeaway-lists"
                          ? 'Try adjusting your search terms or filters'
                          : 'Create your first shopping list to start comparing prices across supermarkets'
                        }
                      </p>
                      {!searchTerm && storeFilter === "all" && activeTab === "my-lists" && (
                        <Button
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() => setShowCreateDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First List
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="takeaway-lists" className="mt-6">
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search my takeaway orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <AnimatePresence>
                {lists.length > 0 ? ( // 'lists' is already filtered by activeTab in loadShoppingLists
                  <div className="space-y-6">
                    <div className="grid gap-6">
                      {lists.map((list) => (
                        <ListCard key={list.id} list={list} />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalLists > 0 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <span className="text-sm text-gray-700">
                          Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalLists)}</span> of <span className="font-semibold">{totalLists}</span> lists
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-700 px-2">
                            Page {currentPage} of {Math.ceil(totalLists / itemsPerPage)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalLists / itemsPerPage)))}
                            disabled={currentPage >= Math.ceil(totalLists / itemsPerPage) || totalLists === 0}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UtensilsCrossed className="w-12 h-12 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {searchTerm ? 'No matching takeaway orders found' : 'No takeaway orders yet'}
                      </h3>
                      <p className="text-gray-500 mb-8">
                        {searchTerm
                          ? 'Try adjusting your search terms or switch to Supermarket lists'
                          : 'You can create takeaway comparisons from the dashboard'
                        }
                      </p>
                      {!searchTerm && (
                        <Button
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => navigate(createPageUrl('Dashboard'))}
                        >
                          Go to Dashboard
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="import-history" className="mt-6">
              <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-600" />
                    Import from Connected Accounts
                  </CardTitle>
                  <CardDescription>Securely sync previous shopping lists from your connected supermarket accounts without browser extensions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleFetchHistoricalLists}
                    disabled={isFetchingHistory}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isFetchingHistory ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Sync Latest Orders
                      </>
                    )}
                  </Button>

                  {historicalLists.length > 0 && (
                    <div className="mt-6">
                      <h3 className="lg font-semibold mb-4">Recent Orders from Connected Accounts</h3>
                      <div className="space-y-6">
                        {historicalLists.map((marketData) => (
                          <div key={marketData.supermarket} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <img
                                src={marketData.logo}
                                alt={marketData.supermarket}
                                className="h-8 w-auto object-contain"
                              />
                              <h3 className="font-bold text-xl text-gray-800">{marketData.supermarket}</h3>
                              <Badge variant="outline" className="ml-auto">
                                {marketData.lists.length} recent orders
                              </Badge>
                            </div>

                            <Accordion type="single" collapsible className="w-full">
                              {marketData.lists.map((list) => (
                                <AccordionItem key={list.id} value={list.id}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full mr-4">
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={marketData.logo}
                                          alt={marketData.supermarket}
                                          className="h-5 w-auto object-contain opacity-60"
                                        />
                                        <span className="font-medium">
                                          Order from {new Date(list.date).toLocaleDateString('en-GB', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {list.items.length} items • Est. £{list.totalEstimated}
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-4">
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {list.items.map((item, itemIndex) => (
                                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-700">{item.name}</span>
                                            <span className="text-gray-500">{item.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Ordered on {new Date(list.date).toLocaleDateString('en-GB')}
                                      </div>
                                      <Button
                                        size="sm"
                                        className="bg-teal-600 hover:bg-teal-700"
                                        onClick={() => handleImportList(list, marketData.supermarket)}
                                      >
                                        <PlayCircle className="w-4 h-4 mr-2" />
                                        Run Comparison
                                      </Button>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
