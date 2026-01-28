function validateUsername(str) {
    const regex = /^(?=[a-z])[a-z0-9_]+$/;
    return regex.test(str);
}

function mergeAndSubArrays(arr1, arr2) {
    const resultMap = arr1.reduce((map, item) => {
        map.set(item.no, { ...item });
        return map;
    }, new Map());
    arr2.forEach((item2) => {
        const { no, qn } = item2;

        if (resultMap.has(no)) {
            resultMap.get(no).qn -= qn;
        } else {
            resultMap.set(no, { no: no, qn: -qn });
        }
    });

    return Array.from(resultMap.values());
}
module.exports = { validateUsername, mergeAndSubArrays };
