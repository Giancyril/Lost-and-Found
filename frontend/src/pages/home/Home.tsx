import Banner from "../../components/banner/Banner";
import Services from "../services/Services";
import RecentLostItem from "../../components/recentItem/RecentLostItem";
import RecentFoundItem from "../../components/recentItem/RecentFoundItem";
import Faq from "../../components/faq/Faq";

const Home = () => {
  return (
    <>
      <Banner />
      <RecentLostItem />
      <RecentFoundItem />
      <Services />
      <Faq />
    </>
  );
};

export default Home;