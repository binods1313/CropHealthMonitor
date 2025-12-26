
import React, { useState, useEffect, useRef } from 'react';
import { FarmData } from '../types';
import { convertWindSpeed } from '../utils/windUtils';
import { UploadCloud, Image as ImageIcon, X, Trash2, Camera, FlaskConical, Beaker, MapPin } from 'lucide-react';

interface FarmEditModalProps {
  farm: FarmData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFarm: FarmData) => void;
}

const FarmEditModal: React.FC<FarmEditModalProps> = ({ farm, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<FarmData>(farm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(farm);
    setErrors({});
  }, [farm, isOpen]);

  if (!isOpen) return null;

  const validate = (data: FarmData): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Explicitly check for NaN and range
    if (typeof data.lat !== 'number' || isNaN(data.lat) || data.lat < -90 || data.lat > 90) {
      newErrors.lat = 'Latitude must be a valid number between -90 and 90';
      isValid = false;
    }
    if (typeof data.lon !== 'number' || isNaN(data.lon) || data.lon < -180 || data.lon > 180) {
      newErrors.lon = 'Longitude must be a valid number between -180 and 180';
      isValid = false;
    }
    if (!data.name || !data.name.trim()) {
      newErrors.name = 'Farm Name is required';
      isValid = false;
    }
    if (!data.crop || !data.crop.trim()) {
      newErrors.crop = 'Crop Type is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // For number inputs, parseFloat but allow intermediate empty strings or invalid input
    // and rely on validate() at submission time.
    const newValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field if user starts typing
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    const oldUnit = formData.gustWindSpeedUnit || 'km/h';
    const currentSpeed = formData.gustWindSpeed || 0;

    // Convert existing value to new unit automatically
    const convertedSpeed = convertWindSpeed(currentSpeed, oldUnit, newUnit);

    setFormData(prev => ({
        ...prev,
        gustWindSpeed: convertedSpeed,
        gustWindSpeedUnit: newUnit
    }));
  };

  const handleSoilChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        soil: {
            ...prev.soil,
            [name]: value === '' ? 0 : parseFloat(value)
        }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate(formData)) {
        onSave(formData);
        onClose();
    }
  };

  const getInputClass = (fieldName: string) => 
    `w-full bg-white border ${errors[fieldName] ? 'border-red-500 focus:border-red-500' : 'border-stone-200 focus:border-agri-500'} rounded-lg px-3 py-2 text-stone-800 focus:outline-none transition-colors`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 shrink-0 flex justify-between items-center">
          <h3 className="font-bold text-stone-800 text-lg">Edit Farm Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6 custom-scrollbar">
            <form id="edit-farm-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Satellite Imagery Section */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-2">
                    <ImageIcon size={16} className="text-blue-500" />
                    Satellite Imagery Source
                </h4>
                
                <div className="relative group">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200 group-hover:border-agri-400 transition-all duration-300 relative flex items-center justify-center">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Farm Satellite Capture" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                           <button type="button" onClick={triggerFileUpload} className="p-2.5 bg-white text-stone-800 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                              <UploadCloud size={16} /> Replace Imagery
                           </button>
                           <button type="button" onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))} className="p-2.5 bg-red-500 text-white rounded-lg shadow-lg hover:scale-105 transition-transform">
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 flex flex-col items-center">
                         <div className="w-14 h-14 rounded-full bg-stone-50 text-stone-300 flex items-center justify-center mb-3">
                            <UploadCloud size={28} />
                         </div>
                         <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">No Imagery Uploaded</p>
                         <button type="button" onClick={triggerFileUpload} className="mt-4 px-5 py-2.5 bg-agri-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-agri-700 transition-all shadow-md active:scale-95">
                            Upload Satellite Frame
                         </button>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed font-medium uppercase tracking-tight">
                  Upload a recent high-resolution L2 satellite capture (JPEG/PNG). This image will be used as the primary source for spatial NDVI spectral analysis and crop stress mapping.
                </p>
            </div>

            {/* General Info Section */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-2">
                    <MapPin size={16} className="text-green-500" />
                    General Information
                </h4>
                
                <div>
                    <label htmlFor="farm-name" className="block text-xs font-bold text-stone-500 uppercase mb-1">Farm Name</label>
                    <input 
                        id="farm-name"
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange}
                        className={getInputClass('name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="farm-crop" className="block text-xs font-bold text-stone-500 uppercase mb-1">Crop Type</label>
                      <input 
                        id="farm-crop"
                        type="text" 
                        name="crop" 
                        value={formData.crop} 
                        onChange={handleChange}
                        className={getInputClass('crop')}
                      />
                      {errors.crop && <p className="text-red-500 text-xs mt-1">{errors.crop}</p>}
                  </div>
                   <div>
                    <label htmlFor="farm-size" className="block text-xs font-bold text-stone-500 uppercase mb-1">Size (Ha)</label>
                    <input 
                        id="farm-size"
                        type="number" 
                        name="sizeHa" 
                        value={formData.sizeHa} 
                        onChange={handleChange}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-agri-500"
                    />
                    </div>
                </div>

                <div>
                    <label htmlFor="farm-location" className="block text-xs font-bold text-stone-500 uppercase mb-1">Location Name</label>
                        <input 
                        id="farm-location"
                        type="text" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-agri-500"
                        />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="farm-lat" className="block text-xs font-bold text-stone-500 uppercase mb-1">Latitude</label>
                        <input 
                            id="farm-lat"
                            type="number" 
                            step="0.0001"
                            name="lat" 
                            value={formData.lat} 
                            onChange={handleChange}
                            className={getInputClass('lat')}
                        />
                        {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat}</p>}
                    </div>
                    <div>
                        <label htmlFor="farm-lon" className="block text-xs font-bold text-stone-500 uppercase mb-1">Longitude</label>
                        <input 
                            id="farm-lon"
                            type="number" 
                            step="0.0001"
                            name="lon" 
                            value={formData.lon} 
                            onChange={handleChange}
                            className={getInputClass('lon')}
                        />
                        {errors.lon && <p className="text-red-500 text-xs mt-1">{errors.lon}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="farm-max-wind" className="block text-xs font-bold text-stone-500 uppercase mb-1">Max Wind Threshold (km/h)</label>
                    <div className="flex items-center gap-2">
                        <input 
                        id="farm-max-wind"
                        type="number" 
                        name="maxWindSpeed" 
                        value={formData.maxWindSpeed || 0} 
                        onChange={handleChange}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-agri-500"
                        />
                        <span className="text-stone-400 text-xs whitespace-nowrap">Safe Limit</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="farm-gust-speed" className="block text-xs font-bold text-stone-500 uppercase mb-1">Gust Wind Speed</label>
                        <input 
                            id="farm-gust-speed"
                            type="number" 
                            step="0.1"
                            name="gustWindSpeed" 
                            value={formData.gustWindSpeed || 0} 
                            onChange={handleChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-agri-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="farm-gust-unit" className="block text-xs font-bold text-stone-500 uppercase mb-1">Gust Unit</label>
                        <select
                            id="farm-gust-unit"
                            name="gustWindSpeedUnit"
                            value={formData.gustWindSpeedUnit || 'km/h'}
                            onChange={handleUnitChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-agri-500"
                        >
                            <option value="km/h">km/h</option>
                            <option value="mph">mph</option>
                            <option value="m/s">m/s</option>
                            <option value="knots">knots</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Soil Data Section */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-2">
                    <FlaskConical size={16} className="text-amber-500" />
                    Soil Sensor Data
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded ml-auto">Manual Override</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="soil-ph" className="block text-xs font-bold text-stone-500 uppercase mb-1">pH Level</label>
                        <input 
                            id="soil-ph"
                            type="number" 
                            step="0.1"
                            name="ph" 
                            value={formData.soil.ph} 
                            onChange={handleSoilChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="soil-organic" className="block text-xs font-bold text-stone-500 uppercase mb-1">Organic Matter (%)</label>
                        <input 
                            id="soil-organic"
                            type="number" 
                            step="0.1"
                            name="organicMatter" 
                            value={formData.soil.organicMatter} 
                            onChange={handleSoilChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="soil-n" className="block text-xs font-bold text-stone-500 uppercase mb-1">Nitrogen (N)</label>
                        <input 
                            id="soil-n"
                            type="number" 
                            name="nitrogen" 
                            value={formData.soil.nitrogen} 
                            onChange={handleSoilChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-[10px] text-stone-400">ppm</span>
                    </div>
                    <div>
                        <label htmlFor="soil-p" className="block text-xs font-bold text-stone-500 uppercase mb-1">Phosphorus (P)</label>
                        <input 
                            id="soil-p"
                            type="number" 
                            name="phosphorus" 
                            value={formData.soil.phosphorus} 
                            onChange={handleSoilChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-500"
                        />
                         <span className="text-[10px] text-stone-400">ppm</span>
                    </div>
                    <div>
                        <label htmlFor="soil-k" className="block text-xs font-bold text-stone-500 uppercase mb-1">Potassium (K)</label>
                        <input 
                            id="soil-k"
                            type="number" 
                            name="potassium" 
                            value={formData.soil.potassium} 
                            onChange={handleSoilChange}
                            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-amber-500"
                        />
                         <span className="text-[10px] text-stone-400">ppm</span>
                    </div>
                </div>
            </div>

            </form>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex gap-3 shrink-0">
             <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-100 transition-colors font-medium"
             >
                Cancel
             </button>
             <button 
                type="submit" 
                form="edit-farm-form"
                className="flex-1 px-4 py-2 bg-agri-600 text-white rounded-lg hover:bg-agri-700 transition-colors font-medium shadow-sm"
             >
                Save Changes
             </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default FarmEditModal;
