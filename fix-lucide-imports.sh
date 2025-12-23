#!/bin/bash

# Script untuk mengganti import lucide-react dengan @heroicons/react

echo "🔄 Converting lucide-react imports to @heroicons/react..."

# Find all files with lucide-react imports
files=$(find app/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "from 'lucide-react'")

for file in $files; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace common imports with heroicons equivalents
    sed -i 's/from .lucide-react./from "@heroicons\/react\/24\/outline"/g' "$file"
    
    # Replace common icon names
    sed -i 's/ArrowLeft/ArrowLeftIcon as ArrowLeft/g' "$file"
    sed -i 's/ArrowRight/ArrowRightIcon as ArrowRight/g' "$file"
    sed -i 's/ChevronRight/ChevronRightIcon as ChevronRight/g' "$file"
    sed -i 's/ChevronLeft/ChevronLeftIcon as ChevronLeft/g' "$file"
    sed -i 's/ChevronDown/ChevronDownIcon as ChevronDown/g' "$file"
    sed -i 's/Upload/ArrowUpTrayIcon as Upload/g' "$file"
    sed -i 's/Download/ArrowDownTrayIcon as Download/g' "$file"
    sed -i 's/Search/MagnifyingGlassIcon as Search/g' "$file"
    sed -i 's/Filter/FunnelIcon as Filter/g' "$file"
    sed -i 's/Plus/PlusIcon as Plus/g' "$file"
    sed -i 's/Edit2/PencilIcon as Edit2/g' "$file"
    sed -i 's/Edit/PencilIcon as Edit/g' "$file"
    sed -i 's/Trash2/TrashIcon as Trash2/g' "$file"
    sed -i 's/Trash/TrashIcon as Trash/g' "$file"
    sed -i 's/Eye/EyeIcon as Eye/g' "$file"
    sed -i 's/EyeOff/EyeSlashIcon as EyeOff/g' "$file"
    sed -i 's/Check/CheckIcon as Check/g' "$file"
    sed -i 's/X/XMarkIcon as X/g' "$file"
    sed -i 's/Calendar/CalendarIcon as Calendar/g' "$file"
    sed -i 's/Camera/CameraIcon as Camera/g' "$file"
    sed -i 's/Image as ImageIcon/PhotoIcon as ImageIcon/g' "$file"
    sed -i 's/Image/PhotoIcon as Image/g' "$file"
    sed -i 's/Star/StarIcon as Star/g' "$file"
    sed -i 's/Heart/HeartIcon as Heart/g' "$file"
    sed -i 's/User/UserIcon as User/g' "$file"
    sed -i 's/Users/UsersIcon as Users/g' "$file"
    sed -i 's/Settings/CogIcon as Settings/g' "$file"
    sed -i 's/Package/CubeIcon as Package/g' "$file"
    sed -i 's/FolderOpen/FolderOpenIcon as FolderOpen/g' "$file"
    sed -i 's/Folder/FolderIcon as Folder/g' "$file"
    sed -i 's/FileText/DocumentTextIcon as FileText/g' "$file"
    sed -i 's/File/DocumentIcon as File/g' "$file"
    sed -i 's/Copy/DocumentDuplicateIcon as Copy/g' "$file"
    sed -i 's/Share/ShareIcon as Share/g' "$file"
    sed -i 's/Link/LinkIcon as Link/g' "$file"
    sed -i 's/ExternalLink/ArrowTopRightOnSquareIcon as ExternalLink/g' "$file"
    sed -i 's/MessageSquare/ChatBubbleLeftEllipsisIcon as MessageSquare/g' "$file"
    sed -i 's/Mail/EnvelopeIcon as Mail/g' "$file"
    sed -i 's/Phone/PhoneIcon as Phone/g' "$file"
    sed -i 's/Globe/GlobeAltIcon as Globe/g' "$file"
    sed -i 's/Home/HomeIcon as Home/g' "$file"
    sed -i 's/Building/BuildingOfficeIcon as Building/g' "$file"
    sed -i 's/MapPin/MapPinIcon as MapPin/g' "$file"
    sed -i 's/Clock/ClockIcon as Clock/g' "$file"
    sed -i 's/TrendingUp/ArrowTrendingUpIcon as TrendingUp/g' "$file"
    sed -i 's/DollarSign/CurrencyDollarIcon as DollarSign/g' "$file"
    sed -i 's/Wrench/WrenchScrewdriverIcon as Wrench/g' "$file"
    sed -i 's/Save/BookmarkIcon as Save/g' "$file"
    
    # Clean up double replacements
    sed -i 's/Icon as as/Icon as/g' "$file"
    sed -i 's/IconIcon as/Icon as/g' "$file"
    
    echo "✅ Converted: $file"
done

echo "🎉 Conversion complete! Testing build..."