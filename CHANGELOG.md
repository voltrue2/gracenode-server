# Change Log

This is a list of manually mantained changes nad updates for each version.

## Version 0.1.21

## Added

None

## Changed

#### Catches missing controllers when mapping them

## Deprecated

None

## Removed

None

***

## Version 0.1.20

## Added

None

## Changed

#### none-json request body's data type is now kept correct

## Deprecated

None

## Removed

None

***

## Version 0.1.19

## Added

None

## Changed

#### request queires other then GET method, does not auto-type-cast

Example: 

```
// request body of POST
{ "id": "12345" }
// will be 
var id = request.data('id');
// "12345"
```

```
// request query of GET
?id=12345
// will be
var id = request.data('id');
// 12345
```

#### Unit test updated

## Deprecated

None

## Removed

None

***

## Version 0.1.18

## Added

None

## Changed

#### Directory structure changed

#### Each request carries a unique request ID

#### Unit test updated

## Deprecated

None

## Removed

None

***
