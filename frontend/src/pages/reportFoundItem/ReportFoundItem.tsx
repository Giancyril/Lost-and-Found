import { useForm, Controller } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { useState, useRef } from "react";
import {
  useCategoryQuery,
  useCreateFoundItemMutation,
  useUploadItemImagesMutation,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useUserVerification } from "../../auth/auth";
import { FaBoxOpen, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import LocationAutocomplete from "../../components/ui/LocationAutocomplete";

const MAX_IMAGES = 6;
const MAX_SIZE_MB = 5;

const ReportFoundItem = () => {
  const users: any = useUserVerification();
  const isAdmin = users?.role === "ADMIN";

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    control,
  } = useForm();

  const [selectedMenu, setselectedMenu] = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);
  };

  const [createFoundItem, { isLoading }] = useCreateFoundItemMutation();
  const [uploadItemImages, { isLoading: isUploading }] = useUploadItemImagesMutation();
  const { data: Category } = useCategoryQuery("");
  const [startDate, setStartDate] = useState(new Date());

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    const incoming = Array.from(files);

    const valid = incoming.filter((f) => {
      if (!f.type.startsWith("image/")) {
        setUploadError("Only image files are allowed.");
        return false;
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`Each file must be under ${MAX_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    const compressedFiles = await Promise.all(valid.map(async (file) => {
      try {
        const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1200, useWebWorker: true };
        return await imageCompression(file, options);
      } catch (error) {
        console.error("Image compression error:", error);
        return file;
      }
    }));

    const combined = [...selectedFiles, ...compressedFiles].slice(0, MAX_IMAGES);
    if (selectedFiles.length + valid.length > MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images allowed.`);
    }
    setSelectedFiles(combined as File[]);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    setPreviews(updated.map((f) => URL.createObjectURL(f)));
    if (primaryIdx >= updated.length) setPrimaryIdx(0);
  };

  const onSubmit = async (data: any) => {
    if (!selectedMenucategoryId) return;
    try {
      const foundData = {
        img: previews[primaryIdx] || "",
        categoryId: selectedMenucategoryId,
        foundItemName: data.foundItemName,
        description: data.description,
        location: data.location,
        date: startDate,
        claimProcess: data.claimProcess,
      };

      const res: any = await createFoundItem(foundData);

      if (res.error || res?.data?.success === false) {
        Modals({ message: "Failed to submit found item", status: false });
        return;
      }

      // Upload images if any were selected
      if (selectedFiles.length > 0 && res?.data?.data?.id) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        formData.append("primaryIndex", String(primaryIdx));
        await uploadItemImages({ id: res.data.data.id, type: "found", formData });
      }

      Modals({ message: "Found item submitted successfully", status: true });
      reset();
      setSelectedFiles([]);
      setPreviews([]);
      setPrimaryIdx(0);
      setUploadError("");
      setselectedMenu("");
      setselectedMenucategoryId("");
    } catch (err: any) {
      Modals({ message: "Failed to submit found item", status: false });
    }
  };

  const isBusy = isLoading || isUploading;

  // Non-admin: show office visit message
  if (!isAdmin) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-4 px-3">
        <div className="w-full max-w-xs mx-auto">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-6 sm:p-10 text-center">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <FaBoxOpen className="text-green-400 text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Found Something?</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Please bring the item to the{" "}
              <span className="text-white font-semibold">SAS Office</span> and our staff will log it into the system. The owner will be notified through the Found Items Board.
            </p>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <FaMapMarkerAlt className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">SAS Office Location</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    National Baptist School of Caloocan — Student Affairs Office
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <FaPhone className="text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white text-sm font-semibold">Office Hours</p>
                  <p className="text-gray-400 text-xs mt-0.5">Monday – Friday, 8:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-xs mt-8">
              Thank you for being honest and helping return lost items to their owners.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Admin: full form
  return (
    <>
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-4 px-3">
        <div className="w-full max-w-lg mx-auto">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-4 sm:p-8">

            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Submit a Found Item</h1>
              <p className="text-gray-500 text-sm">
                Fill out the details below to report an item found on campus.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">

                {/* Item Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Item Name</label>
                  <input
                    {...register("foundItemName", { required: "Item name is required" })}
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Black laptop, Blue water bottle"
                  />
                  {errors.foundItemName && (
                    <p className="text-red-400 text-xs mt-1">{errors.foundItemName?.message as string}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Item Description</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="Describe the item — color, brand, size, markings"
                    {...register("description", { required: "Description is required" })}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.description?.message as string}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Where Found</label>
                  <Controller
                    name="location"
                    control={control}
                    rules={{ required: "Location is required" }}
                    render={({ field }) => (
                      <LocationAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        placeholder="e.g. Library, Canteen, Room 205"
                      />
                    )}
                  />
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">{errors.location?.message as string}</p>
                  )}
                </div>

                {/* Claim Process */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Claim Instructions</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Visit the SAS office with valid ID"
                    {...register("claimProcess", { required: "Claim instructions are required" })}
                  />
                  {errors.claimProcess && (
                    <p className="text-red-400 text-xs mt-1">{errors.claimProcess?.message as string}</p>
                  )}
                </div>

                {/* Date Found */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Date Found</label>
                  <DatePicker
                    wrapperClassName="w-full"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    selected={startDate}
                    onChange={(date: any) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">Item Category</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer text-sm"
                      value={selectedMenucategoryId}
                      onChange={(e) => {
                        const selectedCategory = Category?.data?.find(
                          (cat: any) => cat.id === e.target.value
                        );
                        if (selectedCategory)
                          handleMenuChange(selectedCategory.name, selectedCategory.id);
                      }}
                    >
                      <option value="" disabled className="text-gray-500">Select a category</option>
                      {Category?.data?.map((category: any) => (
                        <option key={category?.id} value={category?.id} className="text-white bg-gray-800">
                          {category?.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  {!selectedMenu && (
                    <p className="text-red-400 text-xs mt-1">Category is required</p>
                  )}
                </div>

              </div>

              {/* Image Upload — full width */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                  Item Photos{" "}
                  <span className="text-gray-500 normal-case font-normal">
                    (up to {MAX_IMAGES} images)
                  </span>
                </label>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-blue-500 bg-blue-900/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <div className="text-gray-400 text-sm">
                    <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                    <p className="text-xs text-gray-600 mt-1">
                      JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB each · {selectedFiles.length}/{MAX_IMAGES} selected
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>
                )}

                {/* Image previews */}
                {previews.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                      {previews.map((src, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all duration-200 cursor-pointer ${
                            idx === primaryIdx
                              ? "border-blue-500 ring-2 ring-blue-500/30"
                              : "border-gray-700 hover:border-gray-500"
                          }`}
                          onClick={() => setPrimaryIdx(idx)}
                          title="Click to set as cover photo"
                        >
                          <img src={src} className="w-full h-full object-cover" alt="" />
                          {idx === primaryIdx && (
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-center text-[10px] font-bold py-0.5">
                              Cover
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center transition-colors duration-150"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Click a photo to set it as the cover image
                    </p>
                  </>
                )}
              </div>

              {/* Submit */}
              {isBusy ? (
                <div className="flex justify-center py-2"><Spinner size="lg" /></div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm mt-2"
                >
                  Submit Found Item
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
      <ToastContainer position="top-right" autoClose={3000} style={{ top: "70px" }} theme="dark" />
    </>
  );
};

export default ReportFoundItem;