import { Filter } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  "All",
  "Robotics",
  "Computer Vision",
  "Sensor Data",
  "Motion Capture",
  "Autonomous Vehicles",
  "Manipulation",
  "Navigation",
  "Human-Robot Interaction",
  "Embodied AI",
];

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Filter className="h-5 w-5 text-gray-400" />
      </div>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-lg appearance-none cursor-pointer text-white"
      >
        {categories.map((category) => (
          <option
            key={category}
            value={category}
            className="bg-gray-800 text-white"
          >
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
