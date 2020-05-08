
# devtools::install_github("tidyverse/googlesheets4") run once installs
# install.packages('rlist', 'tidygeocoder', 'tidyverse', 'qdapTools', 'jsonlite', 'rvest')


library(googlesheets4)
# library(here)
library(dplyr)
library(janitor)
library(tidygeocoder)
# library(rgeocodio)
library(qdapTools)
library(jsonlite)
library(rvest)

lev_of <- function(x) {levels(as.factor(x) )}
'%!in%' <- function(x,y)!('%in%'(x,y))

## put your own dropbox folder here to write out into
dropbox_env <- "C:\\Users\\azada\\Dropbox (Anti-Eviction Mapping Project)\\AMP\\"

### aemp data ####
# run read_sheet command once interactively to auth each session 
# and then you can run the rest of the code in one go, 
# ZZZ todo move rest to source file? 
data <- read_sheet("https://docs.google.com/spreadsheets/d/1PCPWLyyreBHMqRmqM5RiUb0xB6Ja_ADf85t5r79Bp3E/edit#gid=29259935")
data <- janitor::clean_names(data)

#### benfer data ####
# downloading via html not sheets
url <- "https://docs.google.com/spreadsheets/u/1/d/e/2PACX-1vTH8dUIbfnt3X52TrY3dEHQCAm60e5nqo0Rn1rNCf15dPGeXxM9QN9UdxUfEjxwvfTKzbCbZxJMdR7X/pubhtml?gid=1277129435&single=true&urp=gmail_link"
page <- read_html(url)
table <- html_table(page, fill = TRUE)
data_nyu <- table[[1]]
data_nyu <- data_nyu[-1, ]

name <- (data_nyu[1, ])

data_nyu <- data_nyu[-1, ]
data_nyu <- data_nyu[-1, ]
names(data_nyu) <- name

data_nyu <- data_nyu %>% clean_names()
data_nyu_state <- data_nyu %>% filter(grepl( "SUMMARY$", state ))

#fix an input error that makes a state join down the line not work
data_nyu_state <- data_nyu_state %>% 
	mutate(state = ifelse(stringr::str_detect(state, "MARYLAND \\(MD SUMMARY"), "MARYLAND (MD) SUMMARY", state))
data_nyu_state$state_field <- stringr::str_sub(data_nyu_state$state, end = -14 )
data_nyu_state$current_status <- as.factor(data_nyu_state$current_status)

readr::write_csv(data_nyu_state, paste("./data_log/data_nyu",lubridate::today(),".csv"))



#### make variables into factors ####

# variable comes in a list convert to string
data$how_long <- data$after_the_temporary_protection_ends_how_long_will_tenants_have_to_pay_the_rent_they_missed_during_the_emergency
data$how_long1 <- as.factor(sapply(data$how_long,function(x) ifelse(is.null(x),NA,x)))

# multiple value munging ####
# what types of eviction protections
data_fact <- data %>% select(how_are_tenants_protected_against_eviction )
data_fact$protect <- stringr::str_replace_all(as.character(data_fact$how_are_tenants_protected_against_eviction), stringr::fixed("Moratorium (landlords are not allowed to serve notices to tenants)") ,"Moratorium")
data_fact$protect <- stringr::str_replace_all(as.character(data_fact$protect), stringr::fixed("Defense (tenants have a defense in court against eviction actions)") ,"Defense")
data_fact$protect <- as.factor(data_fact$protect)

# what types of evictions 
data_fact2 <- data %>% select(what_types_of_evictions_are_protected)
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$what_types_of_evictions_are_protected), stringr::fixed("No-fault evictions (evictions that are not based on anything the tenant did)") ,"no_fault")
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$eviction_types), stringr::fixed("Evictions for non-payment of rent related to COVID-19") ,"nonpayment_covid")
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$eviction_types), 
																											stringr::fixed("All evictions") ,"all_evictions")
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$eviction_types), 
																											stringr::fixed("Evictions for unauthorized occupants, pets, or nuisance related to COVID-19") ,"covid_other_evictions")

## health and safety types ## RECHECK FOR NEW FACTORS
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$eviction_types), 
																											stringr::fixed("Except when the tenant poses an imminent threat to the health or safety of other occupants of the property, and such threat is stated in the notice as the grounds for the eviction") ,"except_health_safety")
## just cause ## RECHECK for new factors!
data_fact2$eviction_types <- stringr::str_replace_all(as.character(data_fact2$eviction_types), 
																											stringr::fixed("No-cause evictions. (Landlords may still file just-cause evictions, including no-fault evictions. Just-cause eviction protections are extended to condos, duplexes, income-restricted affordable housing, single-family homes, and rooms rented in single-family homes.)") ,
																																		 "no_cause")
# create factors for protection and evictions ####

data_fact_protect <- mtabulate(strsplit(as.character(data_fact$protect), "\\s*,\\s*"))
names(data_fact_protect) <- paste0( "tenant_protection_", make_clean_names(names(data_fact_protect)))
data_fact_protect_rejoin <- data_fact_protect %>% select(tenant_protection_defense, tenant_protection_moratorium)

data_fact_evictions <- mtabulate(strsplit(as.character(data_fact2$eviction_types), "\\s*,\\s*"))
names(data_fact_evictions) <- paste0( "eviction_protection_", make_clean_names(names(data_fact_evictions)))
data_fact_evictions_rejoin <-data_fact_evictions %>% select(eviction_protection_all_evictions, eviction_protection_no_fault, eviction_protection_nonpayment_covid, eviction_protection_covid_other_evictions)

## rejoin and write out current data logs and factors ####
data_tab <- bind_cols(data, data_fact_protect_rejoin, data_fact_evictions_rejoin) %>% select(-after_the_temporary_protection_ends_how_long_will_tenants_have_to_pay_the_rent_they_missed_during_the_emergency, -how_long	)

## write out logs of data factors
readr::write_csv(data_tab, paste("./data_log/data_aemp",lubridate::today(),"2.csv"))
data_log <- data %>% select_if(is.factor)  %>% purrr::map(levels)
rlist::list.save(data_log, paste('./variable_log/factor_list',lubridate::today(),'2.rdata'))

## geocoding ####
data_tab$state <- trimws(toupper(data_tab$what_u_s_state_or_territory_is_it_in))
data_tab$geo <- ifelse( stringr::fixed(as.character(data_tab$state)) == stringr::fixed(trimws(toupper(data$where_does_this_protection_or_campaign_apply))),data_tab$state,
												paste(data_tab$where_does_this_protection_or_campaign_apply,  data_tab$state, sep = ", " ))
#census geocoder
data_tab <-  data_tab %>% tidygeocoder::geocode(geo, method='cascade')

# rejoin state legal data with geocoded aemp data
data_tab_nyu <- data_tab %>% left_join(data_nyu_state, by = c( "state" = "state_field" ) )

# sniff test / check check for unmatched states
#data_unmatched_state <- data_nyu_state %>% anti_join(data_tab, by = c( "state_field" = "state" ) )
#data_unmatched_state %>% View



#### ####

## POINT SCORE ####
data_tab_nyu %>% mutate_if(is.factor, as.character) -> data_tab1

data_tab1 <- data_tab1 %>% 
	mutate(
		pt_1_1_evict_init = case_when( tenant_protection_moratorium == 1 ~ 8, is.na(tenant_protection_moratorium) ~ 0, TRUE ~ 0),
		pt_1_2_evict_init = case_when( tenant_protection_defense == 1 ~ 2, is.na(tenant_protection_defense) ~0 , TRUE ~ 0),
		pt_2_1_protect = case_when (eviction_protection_no_fault 	== 1 ~ 2, is.na(eviction_protection_no_fault) ~ 0 , TRUE ~ 0),
		#pt_2_2_protect = case_when (),	
		pt_2_3_protect = case_when (eviction_protection_nonpayment_covid == 1 ~ 2, is.na(eviction_protection_nonpayment_covid) ~0 , TRUE ~ 0),
		pt_2_4_protect = case_when (eviction_protection_covid_other_evictions == 1 ~ .5, is.na(eviction_protection_covid_other_evictions) ~0 , TRUE ~ 0),
		pt_2_5_protect = case_when (eviction_protection_all_evictions == 1 ~ 5, is.na(eviction_protection_all_evictions) ~0 , TRUE ~ 0),
		
		pt_3_1_pending = case_when( current_status %in% c("Civil Cases Suspended" , 
																											"Civil Cases & Eviction Enforcement Suspended" , 
																											"COVID-19 Related Eviction Cases Suspended",  
																											"Eviction Cases & Enforcement Suspended"  ,  
																											"Eviction Cases Suspended") 	~ 1, TRUE ~ 0),
		pt_3_2_pending = case_when( status_of_non_emergency_court_proceedings %in% c('All Suspended' ) ~ 1, TRUE ~ 0),
		pt_3_3_pending = case_when( tolls_extends_or_stays_court_deadlines %in% c('Y') ~ 1, TRUE ~ 0),
		pt_3_1_tenant_do = case_when( does_the_notification_have_to_be_in_writing %in% c("Yes", "Yes, but email or text is okay" )	~ as.numeric(-1), TRUE ~ 0 ),
		pt_3_2_tenant_do = case_when( how_much_time_do_tenants_have_to_notify_their_landlords %in% 
																		c("Within 7 days after rent is due"   , 
																			"Within 30 days after rent is due" , 
																			"Within 14 days of receipt of written notice from the landlord of the existence of the Cityâ€™s ordinance, unless the totality of the circumstances warrant a longer reasonable period of time." , 
																			"Within 10 days after rent is due"  ,
																			"14 days after landlord issues a written notice of amount of rent due."  , 
																			"Before the expiration of a 3-day notice issued by the landlord for nonpayment of rent"   , 
																			"Before the Notice of Termination (for non-payment of rent) expires"    ) ~ 0, TRUE ~ 0 ),
		pt_3_3_tenant_do = case_when( do_tenants_have_to_provide_documentation_of_their_need_for_the_protection_e_g_that_they_cant_afford_to_pay_rent %in% 
																		c("Yes"  , "Not specified" ) ~ -3, TRUE ~ 0 ),
		pt_3_4_tenant_do = case_when( when_do_tenants_have_to_provide_documentation %in% 
																		c("Within 14 days after rent is due"  , 
																			"within 14 days of receiving a form from landlord about nonpayment of rent",
																			"Within 15 days after rent is due", 
																			"Within 30 days after notifying their landlord", 
																			"Within 30 days after the rent is due" , 
																			"within fourteen (14) days of receiving the written notice from the landlord." ,
																			"Within one week of notifying their landlord" , 
																			"When they notify their landlord") ~ -1.5, TRUE ~ 0 ),
		pt_3_5_tenant_do = case_when( when_do_tenants_have_to_provide_documentation %in% 
																		c("Within three business days of receiving a required notice of rent delinquency from the landlord.",
																			"When they repay their missed rent" , 
																			"No later than the time upon payment of back-due rent" ) ~ -.5, TRUE ~ 0 ),
		pt_3_6_tenant_do = case_when( do_tenants_have_to_provide_documentation_of_their_need_for_the_protection_e_g_that_they_cant_afford_to_pay_rent %in% 
																		c("Yes, but a signed self-certification is acceptable if necessary" ,  
																		"There is no mention of any need to notify landlords of non-payment of rent.", "Not specified" ) ~ 2, TRUE ~ 0 ),
		
		pt_4_1_part_rent = case_when( what_does_the_law_say_about_paying_part_of_the_rent  %in% c( "Tenants must pay as much of the rent as possible" ) ~ -2, TRUE ~ 0),
		# pt_3_2_part_rent = case_when( %in% , -1  0)
		pt_4_3_part_rent = case_when( what_does_the_law_say_about_paying_part_of_the_rent %in% c("There shall be a rebuttable presumption that the tenant paid that portion of the rent that the tenant was reasonably able to pay if the tenant paid at least 50% of the monthly rent." , 
																																														 "Tenants can choose to make partial payments, and the landlord must accept them"   , 
																																														 "Housing agency will work with the property management company it contracts with on rent forbearance."  ) ~  1, TRUE ~ 0))

data_tab1 <- data_tab1 %>% 
	mutate(	
		pt_5_1_how_long = case_when( how_long1 %in% c('Not specified' )~ 5, TRUE ~ 0),
		pt_5_2_how_long = case_when( how_long1 %in% c('One year' , '12 months') ~ 0, TRUE ~ 0),
		pt_5_3_how_long = case_when( how_long1 %in% c('The tenant must pay back rent within six months of the expiration of the local emergency', '120' ,'120 days' ,'180 days', '6 months' , '6 months after emergency' , 'Tenants who were afforded eviction protection under this Resolution shall have up to 120 days after the expiration of the Governorâ€™s Executive Order N-28-20, including any extensions, to pay their landlord all unpaid rent' , 'Up to 120 days after the expiration of the ordinance.' , 'Within 120 days after the emergency order terminates' , 'Within 180 days after the emergency ordinance expires' ,'Within 180 days of termination of the State of Emergency, or within 180 days of the date upon which an extension of the ordinance expires, whichever is later.' , 'Within 180 days of the expiration of the emergency ordinance' , 'Within 6 months after the emergency order expires' , 'within 6 months after the end of the emergency' , 'within six months after the emergency order expires' , 'Within six months after the emergency order expires', 'Within six months following the expiration of the emergency period') 
																~ -1, TRUE ~ 0),
		pt_5_4_how_long = case_when( how_long1 %in% c('Within 90 days after the emergency ordinance terminates' , '60 days' ,'90 days for each month of rent missed' , '90 days to repay 50% of outstanding rent and 180 days to pay 100% of outstanding rent' ,'at least 90 days but no more than 180 days' ,  'Within 90 days after the emergency ordinance terminates')
																~ -3, TRUE ~ 0),
		pt_5_5_how_long = case_when( how_long1 %in% c('Tenants have to pay back rent immediately, unless there is a payment plan'  , 'immediately after the emergency ends, unless they create a payment plan') 
																~ -4, TRUE ~ 0),
		pt_5_6_how_long = case_when( how_long1 %in% c('Not specified')
																~ -5, TRUE ~ 0),
		pt_7_1_fees= case_when( !(can_landlords_charge_late_fees_or_interest_on_missed_rent_payments %in% c('Yes, they can charge late fees')) &
																	!(can_landlords_charge_late_fees_or_interest_on_missed_rent_payments %in% c('Yes, they can charge late fees and interest' )) 
																~ 2, TRUE ~ 0),
		pt_7_2_fees= case_when( (can_landlords_charge_late_fees_or_interest_on_missed_rent_payments %in% c( "No, they can't charge late fees or interest" ))  
														~ 2, TRUE ~ 0))

data_tab1 <- data_tab1 %>% 
	mutate(
		pt_8_1_repay = case_when (what_does_the_policy_say_about_repayment_plans %in% 
															c('\"The City Administrator may issue regulations, guidance, and forms as needed to implement this Ordinance, including but not limited to guidelines for repayment of back rent.\"' ,  
																"Landlords and tenants may agree, in writing, to a repayment period that is longer than 180 days.",    
																"Tenants and landlords are encouraged to agree on a repayment plan",
																"Tenants and landlords are encouraged to agree on a repayment plan, but, in the absence of the agreement to such a plan, The policy creates a default or standard repayment plan in which total of all delayed payment shall be repayed in 4 equal payments to be paid in 30 day intervals beginning the day after the ordinance expires.",
																"Tenants and landlords can agree on a repayment plan (weekly, biweekly, or monthly), but must do so either before the emergency order ends or within 90 days of the first missed rent payment.",
																"The policy creates a default or standard repayment plan") 
															~ -.5, TRUE ~ 0),
		pt_8_2_repay = case_when (what_does_the_policy_say_about_repayment_plans %in%
																c("Landlords who don't want to renew a lease because the tenant didn't pay rent or late fees during the emergency period must FIRST give the tenant a chance to propose a reasonable repayment plan. A proposed plan is considered \"reasonable\" if: all missed rent would be paid back within 12 months of the agreement;  the tenant will be able to afford to make those payments on schedule; and the tenant would continue to pay their future rent in full.") 
															~ -.5, TRUE ~ 0),
		pt_8_3_repay = case_when (what_does_the_policy_say_about_repayment_plans %in%
																c("Tenants and landlords can agree on a repayment plan (weekly, biweekly, or monthly), but must do so either before the emergency order ends or within 90 days of the first missed rent payment.") 
															~ -.5, TRUE ~ 0),
		pt_8_4_repay = case_when (what_does_the_policy_say_about_repayment_plans %in%
																c("The policy creates a default or standard repayment plan" , 
																	"Tenants and landlords are encouraged to agree on a repayment plan, but, in the absence of the agreement to such a plan, The policy creates a default or standard repayment plan in which total of all delayed payment shall be repayed in 4 equal payments to be paid in 30 day intervals beginning the day after the ordinance expires.") 
															~ -.5, TRUE ~ 0))
		# pt_7_1_late_evict = case_when
		
	## landlord obligations to tenant
		# pt11_1
		# pt11_2
		# pt11_3
		# pt11_4

data_tab1 <- data_tab1 %>% 
	mutate(
		pt_9_01_court = case_when( are_courts_holding_eviction_proceedings %in% c("Yes, courts have limited proceedings but may still allow evictions") ~  -2,
															 remote_hearings_allowed_in_non_emergency_civil_cases %in% c("Y") ~ -2, 
															  TRUE ~ 0),
		pt_9_02_court = case_when( are_courts_holding_eviction_proceedings %in% c("No, courts specifically suspended eviction proceedings" , 
																																							"No, courts suspended non-emergency civil proceedings") ~  3, 
															 x3_suspends_hearings_on_eviction %in% c("Y") ~ 3 ,
															  TRUE ~ 0))
		# pt_9_03_court = case_when( ~ -.5, TRUE ~  TRUE ~ 0),

data_tab1 <- data_tab1 %>% 
	mutate(
	pt_9_04_court = case_when( exempts_criminal_activity_damage_to_property_emergency_nuisance_from_eviction_freeze %in% c("Y")~ -.5, TRUE ~ 0),
		pt_9_05_court = case_when( exempts_criminal_activity_damage_to_property_emergency_nuisance_from_eviction_freeze %in% c("Y")~ -.5, TRUE ~ 0),
		pt_9_06_court = case_when( exempts_criminal_activity_damage_to_property_emergency_nuisance_from_eviction_freeze %in% c("Y")~ -.5, TRUE ~ 0),
		pt_9_07_court = case_when( exempts_criminal_activity_damage_to_property_emergency_nuisance_from_eviction_freeze %in% c("Y")~ -.5, TRUE ~ 0),
		pt_9_08_court = case_when( x3_suspends_hearings_on_eviction %in% c("Local Discretion" ) ~ -.5,
															 x4_stays_order_judgment_or_writ_of_eviction %in% c("Local Discretion" ) ~ -.5, TRUE ~ 0),
		pt_9_09_court = case_when( x2_suspends_filing_of_eviction_claim %in%  c("Y", "In Effect Y")~ -.5, TRUE ~ 0),
		pt_9_10_court = case_when( x3_suspends_hearings_on_eviction %in% c("Y", "In Effect Y") ~  -1, TRUE ~ 0),
		pt_9_11_court = case_when( tolls_extends_or_stays_court_deadlines %in% c("Y", "In Effect Y") ~  1, TRUE ~ 0))

data_tab1 <- data_tab1 %>% 
	mutate(
		pt_9_12_court = case_when( will_courts_issue_writs_of_possession_i_e_order_the_tenant_to_leave %in% 
															 		c("Yes", "Courts are no longer required to, issue writs of possession, but they may." ) ~  -1,
															 x4_stays_order_judgment_or_writ_of_eviction %in% 	
															 		c("Y", "In Effect Y", "COVID-19 Related")  ~ -1,
															  TRUE ~ 0))
data_tab1 <- data_tab1 %>% 
	mutate(
		pt_9_13_court = case_when( will_law_enforcement_act_on_writs_of_possession_i_e_forcibly_remove_tenants_from_their_homes %in% 
															 		c("Yes") ~  -1,
															 x5_suspends_enforcement_of_new_order_of_eviction  %in%
															 		c("Y", "In Effect Y", "COVID-19 Related") ~ -1,
															  TRUE ~ 0))
data_tab1 <- data_tab1 %>% 
			mutate(
		pt_10_1_renter_prot = case_when( is_there_a_ban_on_rent_increases %in%
																		 	c("Yes, for all housing",
																		 		"Yes, excluding residents in newer apartment buildings, those who rent from non-corporate landlords, and those who rent space in their landlordsâ€™ homes.")
																		 ~  3, TRUE ~ 0))
data_tab1 <- data_tab1 %>% 
	mutate(
		pt_10_2_renter_prot = case_when( is_there_a_ban_on_rent_increases %in%
																		 	c( "Yes, but only on rent-controlled housing") ~ -2, TRUE ~ 0))
		# 
data_tab1 <- data_tab1 %>% 
	mutate(		pt_10_4_renter_prot = case_when( can_landlords_charge_late_fees_or_interest_on_missed_rent_payments %in% 
																		 	c("No, they can't charge late fees or interest") ~  1,
																		 prohibits_issuance_of_late_fees_to_landlord %in% c('Y') ~ 1,
																		  TRUE ~ 0))
data_tab1 <- data_tab1 %>% 
	mutate(		pt_10_5_renter_prot = case_when( can_tenants_pay_some_or_all_of_their_rent_out_of_their_security_deposit %in%
																		 	c("Yes") ~  2, TRUE ~ 0))
	
# lets add!
data_points <- data_tab1 %>%  select(starts_with("pt"))
data_points1 <- data_points %>%  select(starts_with("pt")) %>% mutate(pts_total = rowSums(.))
data_points2 <- data_points %>%  select(starts_with("pt_1_")) %>% mutate(pts_eviction_initiation_tot_10 = rowSums(.))
data_points3 <- data_points %>%  select(starts_with("pt_2_")) %>% mutate(pts_eviction_protect_tot_04 = rowSums(.))
data_points4 <- data_points %>%  select(starts_with("pt_3_")) %>% mutate(pts_eviction_pending_tot_03 = rowSums(.))
data_points5 <- data_points %>%  select(starts_with("pt_4_")) %>% mutate(pts_tenant_action_tot_00 = rowSums(.))
data_points6 <- data_points %>%  select(starts_with("pt_5_")) %>% mutate(pts_partial_rent_tot_01 = rowSums(.))
data_points7 <- data_points %>%  select(starts_with("pt_6_")) %>% mutate(pts_repayment_period_tot_05 = rowSums(.))
data_points8 <- data_points %>%  select(starts_with("pt_7_")) %>% mutate(pts_latefees_tot_03 = rowSums(.))
data_points9 <- data_points %>%  select(starts_with("pt_8_")) %>% mutate(pts_repayment_plan_tot_00 = rowSums(.))
data_points10 <- data_points %>%  select(starts_with("pt_9_")) %>% mutate(pts_courts_tot_15 = rowSums(.))
data_points11 <- data_points %>%  select(starts_with("pt_10_")) %>% mutate(pts_renter_protection_tot_06 = rowSums(.))

## add landlord obligations once completed

data_points1$rank <- cut(data_points1$pts_total, breaks = 3, labels = c(3,2,1),  names = TRUE)

data_tab_out <- bind_cols(data_tab_nyu, data_points1 %>% select(rank, pts_total), data_points2, data_points3, data_points4, 
													data_points5, data_points6, data_points7, data_points8, data_points9, data_points10, data_points11)

#### data reconciliation / export ####

data_tab_out$policy_type = case_when(stringr::fixed(data_tab_out$do_you_want_to_tell_us_about_eviction_protections) %in% c("Yes") ~ "Eviction Protection", 
																		stringr::fixed(data_tab_out$do_you_want_to_tell_us_about_an_rental_relief_protection) %in% c("Yes") ~ "Renter Relief",
																		stringr::fixed(data_tab_out$do_you_want_to_tell_us_about_a_court_law_enforcement_policy_change) %in% c("Yes") ~ "Court or Law Enforcement_policy",
																		TRUE ~ NA_character_)

data_export <- data_tab_out %>% select(municipality = geo, state, Country = is_it_in_the_united_states_or_a_u_s_territory, admin_scale = what_scale_does_it_apply_to_alcance_o_nivel_administrativo,
																			 lat, lng = long, passed = is_this_an_active_organizing_campaign_or_a_tenant_protection_that_has_been_enacted, policy_summary = tenant_protection_policy_summary,
																			 range = rank, policy_type, link = link_to_source, resource = tenant_resources,
																			 state_level_legal_status = current_status, state_level_legal_summary = state_summary, point_total = pts_total, starts_with("pts_"))

data_export$municipality <- stringi::stri_trans_totitle(sapply(strsplit(data_export$municipality,","), `[`, 1))
data_export$state <- stringi::stri_trans_totitle(data_export$state)
data_export$Country <- ifelse( data_export$Country == "Yes", "United States", NA)
data_export$ISO <- ifelse( data_export$Country == "United States", "USA", NA)
data_export$admin_scale = forcats::fct_recode( data_export$admin_scale, 
																							 "City" = "City // Ciudad",
																							 "County" = "County // Condado" ,
																							 "State" = "State // Estado",
																							 "State" = "Territory" # sorry!
																							 #Nation/ Country
																							 )
data_export$passed <- as.character(forcats::fct_recode( data_export$passed, 
																					"FALSE" = "Active campaign",
																					"FALSE" = "Relief Fund",
																					"TRUE" =  "Existing tenant protection"
																					))
data_export$passed <- as.logical(data_export$passed)
data_export$range <- as.numeric(as.character(data_export$range))


## download international data from first entry sheet, rename and merge####
data_int <- read_sheet("https://docs.google.com/spreadsheets/d/1rvVllKDvzHtzSEphhrgFVMZRCbFCewfOfq3ccwPRa1c/edit#gid=608427658")
data_int <- janitor::clean_names(data_int)
data_int_s <- data_int %>% select(municipality, state, Country = country_5, ISO = iso, admin_scale = administrative_scale, range,
																lng = longitude, lat = latitude, passed = has_the_legislation_been_passed, resource = resources,
																policy_summary = policy_description, resource = resources, policy_type = type_of_policy,
																-start_date, -end_date, -other_feedback_17, -other_feedback_20, -timestamp, -email_address, 
																-country_19)

data_int_filter <- data_int_s %>% filter(ISO != "USA" | (ISO == "USA" & admin_scale == "Country"))
data_int_filter$resource <- NULL ## currently empty so doesn't let a bind happen
## TODO recode international policy type


data_export_dom_int <- bind_rows( data_export, data_int_filter )
data_export_dom_int <- data_export_dom_int %>% replace(., is.na(.), "")

#### repeat dual city / county jurisdictions ####
data_export_dom_int <- bind_rows(data_export_dom_int, 
																 (data_export_dom_int %>% 
																											 	filter(municipality == "San Francisco") %>% mutate(admin_scale = "County")))


#### write out 
readr::write_csv(data_export_dom_int, paste0("./data_out/data_scored",lubridate::today(),".csv"))
readr::write_csv(data_export_dom_int, paste0( dropbox_env, "covid-map\\emergency_tenant_protections_scored.csv"))
