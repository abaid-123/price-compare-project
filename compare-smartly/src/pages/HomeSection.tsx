import AllCategories from "../components/AllCategories";
import Featured from "./Featured";
import HeroSection from "../components/HeroSection";
import HowItWorks from "./HowItWorks";
import StatsStrip from "../components/StatsStrip";
import ReviewsPage from "./Reviews";
// import Navbar from "../components/NavBar";

export default function HomeSection() {
  return (
    <>
      {/* <Navbar /> */}
      <HeroSection />
      <StatsStrip />
      <AllCategories />
      <Featured />
      <HowItWorks />
      <ReviewsPage />
    </>
  );
}
