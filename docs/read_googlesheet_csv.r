# devtools::install_github("tidyverse/googlesheets4")
library(googlesheets4)
library(here)
# library(dplyr)
data <- read_sheet("https://docs.google.com/spreadsheets/d/1AkYjbnLbWW83LTm6jcsRjg78hRVxWsSKQv1eSssDHSM/edit#gid=0")

# write out and back in to try to clear up encoding issues ugh

data$lat[data$lat == "NULL"] <- NA
data$lon[data$lon == "NULL"] <- NA

data$start[data$start == "NULL"] <- NA
data$end[data$end == "NULL"] <- NA

# hack to avoid doing character detection - unix dateformat is 10 characters, so avoiding all 10 character values
# and pulling them back in at end for start and end
data$start1 <- data$start
for (n in 1:length(data$start1)){
	if(nchar(n) != 10) {n <- NA}
}

data$end1 <- data$end
for (n in 1:length(data$end1)){
	if(nchar(n) != 10) {n <- NA}
}

data$start1 <- as.character((as.POSIXct(as.numeric(as.character(data$start1)),origin="1970-01-01",tz="GMT")))
data$end1 <- as.character(as.POSIXct(as.numeric(as.character(data$end1)),origin="1970-01-01",tz="GMT"))

data$start2 <- data$start1
data$end2 <- data$end1

data$start2[is.na(data$start2)] <- data$start[is.na(data$start2)]
data$end2[is.na(data$end1)] <- data$end[is.na(data$end2)]

data$start <- NULL
data$start1 <- NULL
data$end <- NULL
data$end1 <- NULL


data$start3 <- unlist(data$start2)
data$end3 <- unlist(data$end2)

data$start2 <- NULL
data$end2 <- NULL

data <- dplyr::rename(data, start = start3) 
data <- dplyr::rename(data, end = end3) 

data$passed <- as.factor(as.character(data$passed))
data$state <- as.factor(as.character(data$state))
data$admin_scale <- as.factor(as.character(data$admin_scale))
data$policy_type <- as.factor(as.character(data$policy_type))
# data$start <- as.date(as.character(data$date))


View(data)

install.packages("flexdashboard")
if (!require("DT")) install.packages('DT')
DT:::DT2BSClass(c('compact', 'cell-border'))
y <- datatable(head(data), filter = 'top', class = 'cell-border stripe', rownames = FALSE,
					extensions = 'Buttons', options = list(
						dom = 'Bfrtip',
						buttons = c('copy', 'csv', 'excel', 'pdf', 'print'),
						autoWidth = TRUE
					))

DT::saveWidget(y, 'foo.html')
# write.csv(data, "emergency_tenant_protections_carto.csv", row.names = F)

setwd()
