import Banner from "../../components/banner/Banner";
import Services from "../services/Services";
import RecentLostItem from "../../components/recentItem/RecentLostItem";
import RecentFoundItem from "../../components/recentItem/RecentFoundItem";
import Faq from "../../components/faq/Faq";

import CampusHeroes from "./components/CampusHeroes";
import HowItWorks from "./components/HowItWorks";

const Home = () => {
  return (
    <div className="font-sans">
      <Banner />
      <HowItWorks />
      <CampusHeroes />
      <RecentLostItem />
      <RecentFoundItem />
      <Services />
      <Faq />
    </div>
  );
};

export default Home;