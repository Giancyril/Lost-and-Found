import Banner from "../../components/banner/Banner";
import Services from "../services/Services";
import RecentLostItem from "../../components/recentItem/RecentLostItem";
import RecentFoundItem from "../../components/recentItem/RecentFoundItem";
import Faq from "../../components/faq/Faq";

import CampusHeroes from "./components/CampusHeroes";

const Home = () => {
  return (
    <div className="font-sans">
      <Banner />
      <CampusHeroes />
      <RecentLostItem />
      <RecentFoundItem />
      <Services />
      <Faq />
    </div>
  );
};

export default Home;