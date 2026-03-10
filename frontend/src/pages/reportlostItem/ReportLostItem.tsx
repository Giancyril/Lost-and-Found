import { useForm } from "react-hook-form";
import { Spinner } from "flowbite-react";
import Modals from "../../components/modal/Modal";
import { ToastContainer } from "react-toastify";
import { useState } from "react";
import {
  useCategoryQuery,
  useCreateLostItemMutation,
} from "../../redux/api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

  const onSubmit = async (data: any) => {
    try {
      const lostData = {
        lostItemName: data.lostItemName,
        description: data.description,
        categoryId: selectedMenucategoryId,
        img: data.imgUrl,
        location: data.location,
        date: startDate,
      };
      const res: any = await createLostItem(lostData);
      if (res?.data?.success == false) {
        Modals({ message: "Failed to report lost item", status: false });
      } else {
        Modals({ message: "Lost item reported successfully", status: true });
        reset();
      }
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
              <div className="grid gap-6 md:grid-cols-2 mb-4">

                {/* Item Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Item Name
                  </label>
                  <input
                    {...register("lostItemName", {
                      required: "Item name is required",
                    })}
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="e.g. Black laptop, Blue water bottle"
                  />
                  {errors.lostItemName && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.lostItemName?.message as string}
                    </p>
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
                    {...register("description", {
                      required: "Description is required",
                    })}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.description?.message as string}
                    </p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-white uppercase tracking-widest">
                    Image URL
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                    placeholder="Paste an image link (optional)"
                    {...register("imgUrl", {
                      required: "Image URL is required",
                    })}
                  />
                  {errors.imgUrl && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.imgUrl?.message as string}
                    </p>
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
                    {...register("location", {
                      required: "Location is required",
                    })}
                  />
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.location?.message as string}
                    </p>
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
                        if (selectedCategory) {
                          handleMenuChange(selectedCategory.name, selectedCategory.id);
                        }
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
      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ top: "70px" }}
        theme="dark"
      />
    </>
  );
};

export default ReportLostItem;