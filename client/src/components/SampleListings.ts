import placeholder from "../assets//pexels-thethomaseffect94-31794126.jpg";
import placeholder2 from "../assets//pexels-rahimegul-36660076.jpg";

export type SampleListing = {
  name: string;
  imagePath: string;
};

export const SampleListings: SampleListing[] = [
  {
    name: "A Titled Cow",
    imagePath: placeholder,
  },
  {
    name: "A Titled Chicken",
    imagePath: placeholder2,
  },
  {
    name: "A Titled Cow",
    imagePath: placeholder,
  },
  {
    name: "A Titled Chicken",
    imagePath: placeholder2,
  },
];
