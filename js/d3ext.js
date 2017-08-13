function endall(transition, callback) { 
    if (transition.size() === 0) { callback() }
    var n = 0; 
    transition 
        .each(function() { ++n; }) 
        .on("end", function() { if (!--n) callback.apply(this, arguments); }); 
} 

function interpolateRgba(fromRgba, toRgba) {
    var fromRgb = rgb(fromRgba), toRgb = rgb(toRgba),
          rgbInterp = d3.interpolateRgb(fromRgb.rgb, toRgb.rgb),
          aInterp = d3.interpolate(fromRgb.a, toRgb.a)

    return function (t) {
        var c = d3.rgb(rgbInterp(t)), target = toRgba
        return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + aInterp(t) + ')'
    }
    function rgba(colString) {
        if (colString.search(/rgba/) === 0) {
            return colString
        } else {
            if (colString.search(/rgb/) === 0) {
                return colString.replace(/rgb(.*)\)/, 'rgba$1, 1.0)')
            }
        }
    }
    function rgb(colString) {
        if (colString.search(/rgba/) === 0) {
            var regExp = /rgba(.*),\s?(.*)\)/,
                   results = regExp.exec(colString)
            return {
                rgba: results[0],
                rgb: 'rgb' + results[1] + ')',
                a: results[2]
            }
        } else {
            if (colString.search(/rgb/) === 0) {
                return {
                    rgba: null,
                    rgb: colString,
                    a: 1.0
                }
            } else {
                var c = d3.rgb(colString)

                return {
                    rgba: null,
                    rgb: 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')',
                    a: 1.0
                }
            }
        }
    }
}
