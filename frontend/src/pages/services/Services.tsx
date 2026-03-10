import { BiSupport } from "react-icons/bi";
import { TbReport } from "react-icons/tb";
import { FaSearch } from "react-icons/fa";
import { IoLocationSharp, IoShieldCheckmark } from "react-icons/io5";
import { FaGift } from "react-icons/fa6";
import { useGetServicesQuery } from "../../redux/api/api";
import { Spinner } from "flowbite-react";
import React from "react";

interface Service {
  id?: string;
  title: string;
  description: string;
  icon?: string;
}

const getServiceIcon = (title: string): React.ReactElement => {
  const iconMapping: { [key: string]: React.ReactElement } = {
    "Lost Item Reporting": <TbReport size="28" />,
    "Search for Lost Items": <FaSearch size="26" />,
    "Location-Based Services": <IoLocationSharp size="28" />,
    "Help Desk Support": <BiSupport size="28" />,
    "Data Encryption and Privacy": <IoShieldCheckmark size="28" />,
    "Item Claiming": <FaGift size="26" />,
  };
  return iconMapping[title] || <FaSearch size="26" />;
};

const defaultServices: Service[] = [
  {
    title: "Lost Item Reporting",
    description: "Students and staff can quickly report lost items by submitting descriptions, locations, and photos directly through the school portal.",
  },
  {
    title: "Search for Lost Items",
    description: "Search the school's lost and found database using keywords, categories, or campus locations to find a match for your missing item.",
  },
  {
    title: "Location-Based Services",
    description: "Browse items by specific campus areas — classrooms, gym, cafeteria, library — to narrow down where your belongings may have been found.",
  },
  {
    title: "Help Desk Support",
    description: "Our school admin team is available to assist with reports, claims, or any concerns related to lost and found items on campus.",
  },
  {
    title: "Data Encryption and Privacy",
    description: "All student and staff information is protected with industry-standard encryption, ensuring privacy and security at all times.",
  },
  {
    title: "Item Claiming",
    description: "Claim found items through a secure, verified process. Only the rightful owner — confirmed by school ID — can retrieve their belongings.",
  },
];

const Services = () => {
  const { data: servicesData, isLoading } = useGetServicesQuery({});

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-950">
        <div className="flex items-center justify-center">
          <Spinner size="xl" />
        </div>
      </section>
    );
  }

  const services: Service[] = servicesData?.data || defaultServices;

  return (
    <section id="features" className="py-20 bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="px-4 sm:px-6 lg:px-16 mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">What We Offer</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            School Services &{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Everything SAS students and staff need to report, search, and recover lost items on campus — all in one place.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: Service, index: number) => (
            <div
              key={service.id || index}
              className="group bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-blue-700/50 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-600/20 flex items-center justify-center text-blue-400 group-hover:text-cyan-400 group-hover:bg-cyan-600/15 group-hover:border-cyan-600/20 transition-all duration-300 mb-5">
                {getServiceIcon(service.title)}
              </div>
              <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors duration-300 mb-2">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;