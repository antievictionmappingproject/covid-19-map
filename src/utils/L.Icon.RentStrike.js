import svg from "../rent-strike-icon.svg";

export const RentStrikeIcon = L.Icon.extend({
  iconSize: [40, 40],
  iconAnchor: [27, 20],
});

export const rentStrikeIcon = () => new RentStrikeIcon({ iconUrl: svg });
