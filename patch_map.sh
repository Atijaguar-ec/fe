sed -i '' -e 's/let lonCenter = plotCoordinates.reduce(/let validCoords = plotCoordinates.filter(c => c \&\& c.longitude != null \&\& !isNaN(c.longitude) \&\& c.latitude != null \&\& !isNaN(c.latitude));\
    if (validCoords.length === 0) return;\
\
    let lonCenter = validCoords.reduce(/g' apps/inatrace-fe/src/app/shared/map/map.component.ts

sed -i '' -e 's/lonCenter = lonCenter \/ plotCoordinates.length;/lonCenter = lonCenter \/ validCoords.length;/g' apps/inatrace-fe/src/app/shared/map/map.component.ts

sed -i '' -e 's/latCenter = latCenter \/ plotCoordinates.length;/latCenter = latCenter \/ validCoords.length;/g' apps/inatrace-fe/src/app/shared/map/map.component.ts
