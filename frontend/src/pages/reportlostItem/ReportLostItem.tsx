import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { useState, useRef } from "react";
import {
  useCategoryQuery,
  useCreateLostItemMutation,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MAX_SIZE_MB = 5;

const ReportLostItem = () => {
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const [selectedMenu, setselectedMenu] = useState("");
  const [selectedMenucategoryId, setselectedMenucategoryId] = useState("");
  const handleMenuChange = (menuName: string, categoryId: string) => {
    setselectedMenu(menuName);
    setselectedMenucategoryId(categoryId);
  };

  const [createLostItem, { isLoading }] = useCreateLostItemMutation();
  const { data: Category } = useCategoryQuery("");
  const [startDate, setStartDate] = useState(new Date());

  // Single image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setSelectedFile(file);
    // Use FileReader to get base64 — both for preview AND for sending to backend
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string); // base64 string, works as img src and as backend value
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: any) => {
    if (!selectedMenucategoryId) return;
    if (!selectedFile) {
      setUploadError("Please upload a photo of the item.");
      return;
    }
    try {
      const lostData = {
        lostItemName: data.lostItemName,
        description: data.description,
        categoryId: selectedMenucategoryId,
        img: preview || "",
        location: data.location,
        date: startDate,
      };

      const res: any = await createLostItem(lostData);

      if (res?.data?.success === false) {
        Modals({ message: "Failed to report lost item", status: false });
        return;
      }

      Modals({ message: "Lost item reported successfully", status: true });
      reset();
      setSelectedFile(null);
      setPreview("");
      setUploadError("");
      setselectedMenu("");
      setselectedMenucategoryId("");
    } catch (err: any) {
      Modals({ message: "Failed to report lost item", status: false });
    }
  };

  return (
    <>
      <section className="min-h-screen flex items-center justify-center bg-gray-950 py-12">
        <div className="max-w-4xl mx-auto px-6 w-full">
          <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">

            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-1">
                Report a Lost Item
              </h1>
              <p className="text-gray-500 text-sm">
                Fill out the details below to report a missing item. Be as specific as possible to help others identify and return it.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">

                {/* Item Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Item Name
                  </label>
                  <input
                    {...register("lostItemName", { required: "Item name is required" })}
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Black laptop, Blue water bottle"
                  />
                  {errors.lostItemName && (
                    <p className="text-red-400 text-xs mt-1">{errors.lostItemName?.message as string}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Item Description
                  </label>
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
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Last Seen Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Library, Canteen, Room 205"
                    {...register("location", { required: "Location is required" })}
                  />
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">{errors.location?.message as string}</p>
                  )}
                </div>

                {/* Date Lost */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Date Lost
                  </label>
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
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Item Category
                  </label>
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
                      <option value="" disabled className="text-gray-500">
                        Select a category
                      </option>
                      {Category?.data?.map((category: any) => (
                        <option
                          key={category?.id}
                          value={category?.id}
                          className="text-white bg-gray-800"
                        >
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

              {/* Single Image Upload — full width */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                  Item Photo
                  <span className="text-red-500 ml-1">*</span>
                </label>

                {!preview ? (
                  /* Drop zone */
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
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
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-gray-400">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        <span className="text-blue-400 font-medium">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-gray-600">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
                    </div>
                  </div>
                ) : (
                  /* Preview */
                  <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-gray-800">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-64 object-cover"
                    />
                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-gray-900 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                      >
                        Remove
                      </button>
                    </div>
                    {/* File info bar */}
                    <div className="px-3 py-2 bg-gray-900/90 border-t border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400 truncate">{selectedFile?.name}</span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">
                        {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(1) + " MB" : ""}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                  </div>
                )}

                {uploadError && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {uploadError}
                  </p>
                )}
              </div>

              {/* Submit */}
              {isLoading ? (
                <div className="flex justify-center py-2">
                  <Spinner size="lg" />
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-sm mt-2"
                >
                  Submit Lost Item
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

export default ReportLostItem;