import DishArt from './DishArt'
import { getRecipeCategory } from '../../utils/recipeImagery'

// Warm illustrated panel that sits flush at the top of a .card (p-5).
// Uses -mx-5 -mt-5 to bleed to card edges, rounded-t-3xl to match card radius.
// height: fixed px overrides default py-5/sm:py-6 (used by Ask Nooka full-width card).
// size: DishArt size — default "md" for grid cards, "lg" for the Ask Nooka banner.
export default function RecipeCardHeader({ title, height, size = 'md', tileColor }) {
  const category = getRecipeCategory(title)
  const heightStyle = height
    ? { height, maxWidth: 'calc(100% + 2.5rem)' }
    : { maxWidth: 'calc(100% + 2.5rem)' }
  const bg = tileColor || 'bg-orange-50'
  return (
    <div
      className={`${bg} rounded-t-3xl -mx-5 -mt-5 mb-4 flex justify-center items-center overflow-hidden${height ? '' : ' py-5 sm:py-6'}`}
      style={heightStyle}
    >
      <DishArt category={category} size={size} />
    </div>
  )
}
